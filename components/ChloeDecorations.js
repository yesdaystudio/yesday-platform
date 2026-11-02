// Bounds and rotations from Figma 2:1170 and 55:903. Each flower is an
// independent image layer; the watercolor is never a flattened page render.
const desktop = [
  [-408.67,280,799.307,889.192,600,740,18,.55,7],
  [1060,110.22,781.448,858.808,560,700,-22,.55,6],
  [3.45,380,492.458,603.1,420,550,8,.5,3.5],
  [930,308.52,546.815,639.244,440,560,-12,.5,3.5],
  [520,470.11,404.6,499.23,380,480,-3,.4,2.5],
  [-389.72,260,807.483,884.844,580,720,22,.95,0],
  [1020,54.51,810.184,874.644,560,700,-26,.95,0],
  [24.36,380,428.21,520.638,340,460,12,.9,0],
  [980,340.77,478.36,560.635,360,480,-16,.9,0],
  [346.88,450,312.054,402.958,280,380,5,.88,0],
  [760,473.44,346.512,433.579,300,400,-7,.88,0],
  [-290,440,559.09,588.372,380,460,30,1,0],
  [1100,328.03,593.58,619.031,400,480,-32,1,0],
]
const mobile = [
  [-216.25,320,387.053,431.995,290,360,18,.55,4.5],
  [235,203.86,381.452,425.658,270,350,-22,.55,4],
  [95,452,200,260,200,260,0,.4,2.5],
  [-228.62,375,364.688,403.368,260,330,22,.95,0],
  [270,236.02,382.733,419.566,260,340,-26,.95,0],
  [26.36,470,202.335,254.575,175,235,7,.88,0],
  [190,469.28,196.153,244.041,170,225,-7,.88,0],
]
const desktopEdge = [
  [-151.08,60,409.217,711.815,340,680,6,.82,0],
  [-20,472.17,242.589,344.72,200,320,-8,.48,0],
  [-100,207.44,199.093,291.874,180,280,-4,.55,0],
  [-85.74,380,182.681,244.3,140,220,12,.42,0],
]
const mobileEdge = [
  [-34.22,38,127.675,278.974,100,270,6,.85,0],
  [-4,449.14,102.292,189.104,78,180,-8,.55,0],
  [0,226.28,96.449,215.208,82,210,-4,.65,0],
  [-29.42,390,107.851,191.036,72,180,12,.58,0],
]
function Layers({ layers, mobile: isMobile, edge }) {
  return <span aria-hidden="true" className={`chloeLayers chloeLayers--${isMobile ? 'mobile' : 'desktop'}`}>
    {layers.map(([x,y,bw,bh,w,h,rotation,opacity,blur], index) => <span key={index} className="chloeLayer" style={{ left:x, top:y, width:bw, height:bh }}>
      {/* The inner image retains the unrotated Figma layer dimensions. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/templates/chloe/${edge ? 'painted-flowers' : 'gypsophila'}.png`} alt="" width={w} height={h} style={{width:w,height:h,transform:`rotate(${rotation}deg)`,opacity,filter:blur ? `blur(${blur}px)` : undefined}} />
    </span>)}
  </span>
}
export default function ChloeDecorations({ edge = false }) {
  return <><Layers layers={edge ? desktopEdge : desktop} edge={edge} /><Layers layers={edge ? mobileEdge : mobile} mobile edge={edge} /></>
}
