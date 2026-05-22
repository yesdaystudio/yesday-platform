import 'server-only'

import { getSupabaseAdmin } from '../supabaseAdmin'

const ALLOWED_PACKAGES = new Set(['essential', 'signature', 'atelier'])
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

/**
 * @typedef {Object} OnboardingPayload
 * @property {string} customer_email
 * @property {string} package_type
 * @property {string} couple_display_name
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
      authUserId = await createOrResolveAuthUser(payload.customer_email)
    }

    if (!projectId || !projectSlug) {
      const baseSlug = projectSlug || payload.slug || slugify(payload.couple_display_name)
      const uniqueSlug = await ensureUniqueSlug(baseSlug)

      const createdProject = await createProject({
        slug: uniqueSlug,
        coupleDisplayName: payload.couple_display_name,
        packageType: payload.package_type,
        authUserId,
      })

      projectId = createdProject.id
      projectSlug = createdProject.slug
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
      .select('id, provider, external_order_id, external_event_id, status, auth_user_id, project_id, slug, retries')
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
    .select('id, provider, external_order_id, external_event_id, status, auth_user_id, project_id, slug, retries')
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
        .select('id, provider, external_order_id, external_event_id, status, auth_user_id, project_id, slug, retries')
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
    .select('id, provider, external_order_id, external_event_id, status, auth_user_id, project_id, slug, retries')
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
    .select('id, provider, external_order_id, external_event_id, status, auth_user_id, project_id, slug, retries')
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
    .select('id, provider, external_order_id, external_event_id, status, auth_user_id, project_id, slug, retries')
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

async function createProject({ slug, coupleDisplayName, packageType, authUserId }) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .insert({
      slug,
      couple_display_name: coupleDisplayName,
      package_type: packageType,
      owner_user_id: authUserId,
    })
    .select('id, slug')
    .single()

  if (projectError || !project) {
    throw new Error(projectError?.message || 'Failed to create project')
  }

  return project
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
  const randomPassword = createRandomPassword()

  const { data: createdUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
  })

  if (createdUserData?.user?.id) {
    return createdUserData.user.id
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
      return matchedUser.id
    }

    if (users.length < 200) {
      break
    }

    page += 1
  }

  throw new Error('Auth user already exists but could not be resolved')
}

function createRandomPassword() {
  const randomSegment = Math.random().toString(36).slice(2)
  return `Yesday-${Date.now()}-${randomSegment}!`
}
