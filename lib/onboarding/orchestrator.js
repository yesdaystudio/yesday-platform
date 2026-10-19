import 'server-only'

import { getSupabaseAdmin } from '../supabaseAdmin'

const ALLOWED_PACKAGES = new Set(['essential', 'signature', 'atelier'])
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
}
const JOB_SELECT = 'id, provider, external_order_id, external_event_id, status, auth_user_id, project_id, slug, retries, payload_snapshot'

/**
 * @typedef {Object} OnboardingPayload
 * @property {string} customer_email
 * @property {string} package_type
 * @property {string} couple_display_name
 * @property {string} [design_family]
 * @property {string} [slug]
 * @property {string} external_order_id
 * @property {string} provider
 * @property {string} [external_event_id]
 */

/**
 * Creates (or resolves) client identity and seeds project defaults.
 *
 * @param {OnboardingPayload} rawPayload
 */
export async function runOnboarding(rawPayload) {
  const payload = validatePayload(rawPayload)

  const onboardingJob = await getOrCreateOnboardingJob(payload)
  const existingCompleted = toCompletedResult(onboardingJob)

  if (existingCompleted) {
    if (!hasAccessEmailBeenSent(onboardingJob)) {
      await sendExistingUserAccessEmail(payload.customer_email)
      await markAccessEmailSent(onboardingJob.id, payload)
    }
    return existingCompleted
  }

  const claimedJob = await claimOnboardingJob(onboardingJob, payload)

  if (!claimedJob) {
    const refreshedJob = await getOnboardingJobById(onboardingJob.id)
    const completedRefreshed = toCompletedResult(refreshedJob)

    if (completedRefreshed) {
      return completedRefreshed
    }

    throw new Error('Onboarding job is already being processed')
  }

  let authUserId = claimedJob.auth_user_id || null
  let projectId = claimedJob.project_id || null
  let projectSlug = claimedJob.slug || null

  try {
    if (!authUserId) {
      const identity = await createOrResolveAuthUser(payload.customer_email)
      authUserId = identity.userId
      await markAccessEmailSent(claimedJob.id, payload)
    } else if (!hasAccessEmailBeenSent(claimedJob)) {
      await sendExistingUserAccessEmail(payload.customer_email)
      await markAccessEmailSent(claimedJob.id, payload)
    }

    if (!projectId || !projectSlug) {
      const legacyProject = await findLegacyCheckoutProject(payload)

      if (legacyProject) {
        await attachLegacyProjectToUser(legacyProject.id, payload, authUserId)
        projectId = legacyProject.id
        projectSlug = legacyProject.slug
      } else {
        const baseSlug = projectSlug || payload.slug || slugify(payload.couple_display_name)
        const uniqueSlug = await ensureUniqueSlug(baseSlug)

        const createdProject = await createProject({
          slug: uniqueSlug,
          coupleDisplayName: payload.couple_display_name,
          packageType: payload.package_type,
          designFamily: payload.design_family,
          clientEmail: payload.customer_email,
          authUserId,
        })

        projectId = createdProject.id
        projectSlug = createdProject.slug
      }
    }

    await ensureWebsiteContent(projectId)

    await markOnboardingCompleted(claimedJob.id, {
      authUserId,
      projectId,
      slug: projectSlug,
    })

    return {
      project_slug: projectSlug,
      user_id: authUserId,
    }
  } catch (error) {
    await markOnboardingFailed(claimedJob.id, {
      errorMessage: error instanceof Error ? error.message : 'Onboarding failed',
      authUserId,
      projectId,
      slug: projectSlug,
    })

    throw error
  }
}

function validatePayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('Invalid payload: expected object')
  }

  const customerEmail = String(rawPayload.customer_email || '').trim().toLowerCase()
  const packageType = String(rawPayload.package_type || '').trim().toLowerCase()
  const coupleDisplayName = String(rawPayload.couple_display_name || '').trim()
  const externalOrderId = String(rawPayload.external_order_id || '').trim()
  const provider = String(rawPayload.provider || '').trim().toLowerCase()
  const externalEventId = String(rawPayload.external_event_id || '').trim()
  const slug = String(rawPayload.slug || '').trim().toLowerCase()
  const designFamily = normalizeDesignFamily(rawPayload.design_family)

  if (!customerEmail) {
    throw new Error('Missing required field: customer_email')
  }

  if (!packageType) {
    throw new Error('Missing required field: package_type')
  }

  if (!ALLOWED_PACKAGES.has(packageType)) {
    throw new Error('Invalid package_type value')
  }

  if (!coupleDisplayName) {
    throw new Error('Missing required field: couple_display_name')
  }

  if (!externalOrderId) {
    throw new Error('Missing required field: external_order_id')
  }

  if (!provider) {
    throw new Error('Missing required field: provider')
  }

  return {
    customer_email: customerEmail,
    package_type: packageType,
    couple_display_name: coupleDisplayName,
    design_family: designFamily,
    slug,
    external_order_id: externalOrderId,
    provider,
    external_event_id: externalEventId || null,
  }
}

async function getOrCreateOnboardingJob(payload) {
  const supabaseAdmin = getSupabaseAdmin()

  if (payload.external_event_id) {
    const { data: eventJob, error: eventError } = await supabaseAdmin
      .from('onboarding_jobs')
      .select(JOB_SELECT)
      .eq('provider', payload.provider)
      .eq('external_event_id', payload.external_event_id)
      .maybeSingle()

    if (eventError) {
      throw new Error(eventError.message || 'Failed to query onboarding job by event id')
    }

    if (eventJob) {
      if (eventJob.external_order_id !== payload.external_order_id) {
        throw new Error('Stripe event id already linked to a different order id')
      }

      return eventJob
    }
  }

  const { data: existingJob, error: existingError } = await supabaseAdmin
    .from('onboarding_jobs')
    .select(JOB_SELECT)
    .eq('provider', payload.provider)
    .eq('external_order_id', payload.external_order_id)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message || 'Failed to query onboarding job')
  }

  if (existingJob) {
    if (!existingJob.external_event_id && payload.external_event_id) {
      const { data: updatedJob, error: updateError } = await supabaseAdmin
        .from('onboarding_jobs')
        .update({
          external_event_id: payload.external_event_id,
          payload_snapshot: payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingJob.id)
        .select(JOB_SELECT)
        .single()

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update onboarding job event id')
      }

      return updatedJob
    }

    return existingJob
  }

  const { data: createdJob, error: createJobError } = await supabaseAdmin
    .from('onboarding_jobs')
    .insert({
      provider: payload.provider,
      external_order_id: payload.external_order_id,
      external_event_id: payload.external_event_id,
      status: JOB_STATUS.PENDING,
      payload_snapshot: payload,
      retries: 0,
    })
    .select(JOB_SELECT)
    .single()

  if (!createJobError && createdJob) {
    return createdJob
  }

  const duplicateInsertError =
    String(createJobError?.message || '').toLowerCase().includes('duplicate') ||
    String(createJobError?.message || '').toLowerCase().includes('unique')

  if (!duplicateInsertError) {
    throw new Error(createJobError?.message || 'Failed to create onboarding job')
  }

  const { data: raceResolvedJob, error: raceResolveError } = await supabaseAdmin
    .from('onboarding_jobs')
    .select(JOB_SELECT)
    .eq('provider', payload.provider)
    .eq('external_order_id', payload.external_order_id)
    .single()

  if (raceResolveError || !raceResolvedJob) {
    throw new Error(raceResolveError?.message || 'Failed to resolve onboarding job after conflict')
  }

  return raceResolvedJob
}

async function claimOnboardingJob(onboardingJob, payload) {
  const supabaseAdmin = getSupabaseAdmin()
  const nextRetry = Number(onboardingJob.retries || 0) + 1

  const { data: claimedJob, error: claimError } = await supabaseAdmin
    .from('onboarding_jobs')
    .update({
      status: JOB_STATUS.PROCESSING,
      payload_snapshot: payload,
      external_event_id: onboardingJob.external_event_id || payload.external_event_id,
      error_message: null,
      retries: nextRetry,
      updated_at: new Date().toISOString(),
    })
    .eq('id', onboardingJob.id)
    .in('status', [JOB_STATUS.PENDING, JOB_STATUS.FAILED])
    .select(JOB_SELECT)
    .maybeSingle()

  if (claimError) {
    throw new Error(claimError.message || 'Failed to claim onboarding job')
  }

  return claimedJob || null
}

async function getOnboardingJobById(jobId) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: job, error: jobError } = await supabaseAdmin
    .from('onboarding_jobs')
    .select('id, status, auth_user_id, project_id, slug')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error(jobError?.message || 'Failed to reload onboarding job')
  }

  return job
}

function toCompletedResult(job) {
  if (!job || job.status !== JOB_STATUS.COMPLETED) {
    return null
  }

  if (!job.slug || !job.auth_user_id) {
    return null
  }

  return {
    project_slug: job.slug,
    user_id: job.auth_user_id,
  }
}

async function createProject({ slug, coupleDisplayName, packageType, designFamily, clientEmail, authUserId }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .insert({
      slug,
      couple_display_name: coupleDisplayName,
      package_type: packageType,
      design_family: designFamily,
      client_email: clientEmail,
      owner_user_id: authUserId,
      payment_status: 'paid',
      project_status: 'active',
    })
    .select('id, slug')
    .single()

  if (projectError || !project) {
    throw new Error(projectError?.message || 'Failed to create project')
  }

  return project
}

async function findLegacyCheckoutProject(payload) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: stripeProject, error: stripeProjectError } = await supabaseAdmin
    .from('projects')
    .select('id, slug')
    .eq('stripe_checkout_session_id', payload.external_order_id)
    .maybeSingle()

  if (!stripeProjectError && stripeProject) return stripeProject

  const missingStripeColumn = String(stripeProjectError?.message || '').toLowerCase().includes('stripe_checkout_session_id')
  if (stripeProjectError && !missingStripeColumn) {
    throw new Error(stripeProjectError.message || 'Failed to resolve checkout project')
  }

  const { data: emailProjects, error: emailProjectError } = await supabaseAdmin
    .from('projects')
    .select('id, slug, owner_user_id')
    .eq('client_email', payload.customer_email)
    .order('created_at', { ascending: false })
    .limit(10)

  if (emailProjectError) {
    throw new Error(emailProjectError.message || 'Failed to resolve legacy checkout project')
  }

  return (emailProjects || []).find((project) => !project.owner_user_id) || null
}

async function attachLegacyProjectToUser(projectId, payload, authUserId) {
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from('projects')
    .update({
      owner_user_id: authUserId,
      package_type: payload.package_type,
      design_family: payload.design_family,
      payment_status: 'paid',
      project_status: 'active',
    })
    .eq('id', projectId)

  if (error) throw new Error(error.message || 'Failed to attach checkout project to user')
}

async function ensureWebsiteContent(projectId) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: existingContent, error: existingContentError } = await supabaseAdmin
    .from('website_content')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle()

  if (existingContentError) {
    throw new Error(existingContentError.message || 'Failed to check website content')
  }

  if (existingContent?.id) {
    return
  }

  const { error: insertError } = await supabaseAdmin
    .from('website_content')
    .insert({
      project_id: projectId,
    })

  if (!insertError) {
    return
  }

  const duplicateInsert =
    String(insertError.message || '').toLowerCase().includes('duplicate') ||
    String(insertError.message || '').toLowerCase().includes('unique')

  if (!duplicateInsert) {
    throw new Error(insertError.message || 'Failed to create website content')
  }
}

async function markOnboardingCompleted(jobId, { authUserId, projectId, slug }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from('onboarding_jobs')
    .update({
      status: JOB_STATUS.COMPLETED,
      auth_user_id: authUserId,
      project_id: projectId,
      slug,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(error.message || 'Failed to finalize onboarding job')
  }
}

async function markOnboardingFailed(jobId, { errorMessage, authUserId, projectId, slug }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from('onboarding_jobs')
    .update({
      status: JOB_STATUS.FAILED,
      error_message: errorMessage,
      auth_user_id: authUserId,
      project_id: projectId,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(error.message || 'Failed to mark onboarding job as failed')
  }
}

function slugify(value) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `yesday-${Date.now()}`
}

function normalizeDesignFamily(value) {
  const design = String(value || '').trim().toLowerCase()
  return ['diana', 'botanique', 'penelope'].includes(design) ? design : 'diana'
}

async function ensureUniqueSlug(initialSlug) {
  const supabaseAdmin = getSupabaseAdmin()
  const safeBase = initialSlug || `yesday-${Date.now()}`
  let candidate = safeBase
  let suffix = 1

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw new Error(error.message || 'Failed to validate slug uniqueness')
    }

    if (!data) {
      return candidate
    }

    candidate = `${safeBase}-${suffix}`
    suffix += 1
  }
}

async function createOrResolveAuthUser(email) {
  const supabaseAdmin = getSupabaseAdmin()
  const redirectTo = getAccessRedirectUrl()

  const { data: createdUserData, error: createUserError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { source: 'yesday-checkout' },
  })

  if (createdUserData?.user?.id) {
    return { userId: createdUserData.user.id }
  }

  if (!createUserError) {
    throw new Error('Failed to create auth user')
  }

  const duplicateUserError =
    String(createUserError.message || '').toLowerCase().includes('already') ||
    String(createUserError.message || '').toLowerCase().includes('exists')

  if (!duplicateUserError) {
    throw new Error(createUserError.message || 'Failed to create auth user')
  }

  let page = 1

  while (true) {
    const { data: listedUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (listError) {
      throw new Error(listError.message || 'Failed to resolve existing auth user')
    }

    const users = listedUsersData?.users || []
    const matchedUser = users.find((user) => String(user.email || '').toLowerCase() === email)

    if (matchedUser?.id) {
      await sendExistingUserAccessEmail(email)
      return { userId: matchedUser.id }
    }

    if (users.length < 200) {
      break
    }

    page += 1
  }

  throw new Error('Auth user already exists but could not be resolved')
}

async function sendExistingUserAccessEmail(email) {
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: getAccessRedirectUrl(),
  })

  if (error) throw new Error(error.message || 'Failed to send client access email')
}

function getAccessRedirectUrl() {
  const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')
  if (!siteUrl) throw new Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  return `${siteUrl}/reset-password`
}

function hasAccessEmailBeenSent(job) {
  return Boolean(job?.payload_snapshot?.access_email_sent_at)
}

async function markAccessEmailSent(jobId, payload) {
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from('onboarding_jobs')
    .update({
      payload_snapshot: { ...payload, access_email_sent_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) throw new Error(error.message || 'Failed to record access email delivery')
}
