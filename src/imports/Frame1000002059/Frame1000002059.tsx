import svgPaths from "./svg-engsglgmjq";
import imgSaturation from "./458f2818f67ac510bf236b7338011eb2a3bdbb99.png";

function Container1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[9px] relative shrink-0" data-name="Container">
      <p className="capitalize font-['Roboto:Medium',sans-serif] font-medium leading-[24px] relative shrink-0 text-[#2196f3] text-[14px] tracking-[0.4px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Solid
      </p>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[9px] relative shrink-0" data-name="Container">
      <p className="capitalize font-['Roboto:Medium',sans-serif] font-medium leading-[24px] relative shrink-0 text-[14px] text-[rgba(0,0,0,0.6)] tracking-[0.4px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Linear
      </p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Container">
      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="<Tab>">
        <Container1 />
        <div className="absolute bottom-0 h-0 left-0 right-0" data-name="Line">
          <div className="absolute inset-[-2px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66 2">
              <line id="Line" stroke="var(--stroke-0, #2196F3)" strokeWidth="2" x2="66" y1="1" y2="1" />
            </svg>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="<Tab>">
        <Container2 />
      </div>
    </div>
  );
}

function Sliders() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-name="sliders">
      <div className="bg-gradient-to-b from-[#9e428f] relative rounded-[1px] shrink-0 to-[#ff8585] w-full" data-name=".hue">
        <div className="overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex items-start px-[106px] py-px relative size-full">
            <div className="bg-white h-[8px] rounded-[1px] shrink-0 w-[4px]" />
          </div>
        </div>
      </div>
      <div className="relative rounded-[1px] shrink-0 w-full" data-name=".saturation">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[1px] size-full" src={imgSaturation} />
        <div className="content-stretch flex items-start px-[167px] py-px relative size-full">
          <div className="bg-white h-[8px] rounded-[1px] shrink-0 w-[4px]" />
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="ColorizeRounded">
        <div className="absolute inset-[12.49%_12.5%_12.5%_12.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12.0017">
            <path d={svgPaths.p1b953900} fill="var(--fill-0, black)" fillOpacity="0.56" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Slider() {
  return (
    <div className="content-stretch flex gap-[4px] items-start relative shrink-0 w-full" data-name="Slider">
      <Sliders />
      <div className="relative rounded-[4px] shrink-0 size-[24px]" data-name=".swatch">
        <div className="absolute bg-[#1e88e5] inset-0 rounded-[4px]" data-name="Swatch" />
      </div>
      <Frame7 />
    </div>
  );
}

function Placeholder() {
  return (
    <div className="content-stretch flex items-center overflow-clip relative shrink-0" data-name="placeholder">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-left whitespace-nowrap">
        <p className="leading-[16px]">#1890FF</p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-white h-full relative rounded-[2px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative size-full">
          <Placeholder />
        </div>
      </div>
    </div>
  );
}

function Placeholder1() {
  return (
    <div className="content-stretch flex items-center overflow-clip relative shrink-0" data-name="placeholder">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-left whitespace-nowrap">
        <p className="leading-[16px]">24</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[2px]">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative size-full">
          <Placeholder1 />
        </div>
      </div>
    </div>
  );
}

function Placeholder2() {
  return (
    <div className="content-stretch flex items-center overflow-clip relative shrink-0" data-name="placeholder">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-left whitespace-nowrap">
        <p className="leading-[16px]">24</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-w-px relative rounded-[2px]">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative size-full">
          <Placeholder2 />
        </div>
      </div>
    </div>
  );
}

function Placeholder3() {
  return (
    <div className="content-stretch flex items-center overflow-clip relative shrink-0" data-name="placeholder">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-left whitespace-nowrap">
        <p className="leading-[16px]">255</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-white h-full relative rounded-[2px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative size-full">
          <Placeholder3 />
        </div>
      </div>
    </div>
  );
}

function Placeholder4() {
  return (
    <div className="content-stretch flex items-center overflow-clip relative shrink-0" data-name="placeholder">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-left whitespace-nowrap">
        <p className="leading-[16px]">100</p>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-white h-full relative rounded-[2px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[2px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative size-full">
          <Placeholder4 />
        </div>
      </div>
    </div>
  );
}

function ColorAdjustment() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="color adjustment">
      <Slider />
      <div className="content-stretch cursor-pointer flex gap-[4px] items-center relative shrink-0 w-full" data-name="LayoutBlocks/horizontal×5">
        <button className="bg-white h-[32px] relative rounded-[4px] shrink-0" data-name="Size=small, State=normal, Filled=false">
          <div className="content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
            <div className="flex flex-row items-center self-stretch">
              <Frame />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        </button>
        <button className="bg-white flex-[1_0_0] h-[32px] min-w-px relative rounded-[4px]" data-name="Size=small, State=normal, Filled=false">
          <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[inherit] size-full">
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
              <Frame1 />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        </button>
        <button className="bg-white flex-[1_0_0] h-[32px] min-w-px relative rounded-[4px]" data-name="Size=small, State=normal, Filled=false">
          <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[inherit] size-full">
            <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
              <Frame2 />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        </button>
        <button className="bg-white flex-[1_0_0] h-[32px] min-w-px relative rounded-[4px]" data-name="Size=small, State=normal, Filled=false">
          <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[inherit] size-full">
            <div className="flex flex-row items-center self-stretch">
              <Frame3 />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        </button>
        <button className="bg-white flex-[1_0_0] h-[32px] min-w-px relative rounded-[4px]" data-name="Size=small, State=normal, Filled=false">
          <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[inherit] size-full">
            <div className="flex flex-row items-center self-stretch">
              <Frame4 />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[4px]" />
        </button>
      </div>
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="LayoutBlocks/horizontal×5">
        <div className="content-stretch flex flex-col items-start justify-center overflow-clip px-[5px] relative shrink-0" data-name="Type=Text, Hierarchy=primary, Bullet=false, Editable=false, Copyable=false, FootNote=No">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-center w-[52px]">Hex</p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-w-px overflow-clip relative" data-name="Type=Text, Hierarchy=primary, Bullet=false, Editable=false, Copyable=false, FootNote=No">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-center whitespace-nowrap">R</p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-w-px overflow-clip relative" data-name="Type=Text, Hierarchy=primary, Bullet=false, Editable=false, Copyable=false, FootNote=No">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-center whitespace-nowrap">G</p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-w-px overflow-clip relative" data-name="Type=Text, Hierarchy=primary, Bullet=false, Editable=false, Copyable=false, FootNote=No">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-center whitespace-nowrap">B</p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-w-px overflow-clip relative" data-name="Type=Text, Hierarchy=primary, Bullet=false, Editable=false, Copyable=false, FootNote=No">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[11px] text-[rgba(0,0,0,0.87)] text-center whitespace-nowrap">A</p>
        </div>
      </div>
    </div>
  );
}

function SelectColor() {
  return (
    <div className="bg-white h-[271px] relative shrink-0 w-full" data-name="select color">
      <div className="content-stretch flex flex-col gap-[4px] items-start pb-[4px] pt-[8px] px-[8px] relative size-full">
        <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0" data-name="<Tabs>">
          <Container />
        </div>
        <div className="bg-gradient-to-b flex-[1_0_0] from-[#9e428f] min-h-px relative rounded-[4px] to-[#ff8585] w-full" data-name=".color-space">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex items-start px-[22px] py-[6px] relative size-full">
              <div className="relative shrink-0 size-[7px]" data-name="pointer">
                <div className="absolute inset-[-100%_-128.57%_-157.14%_-128.57%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                    <g filter="url(#filter0_d_154_1889)" id="pointer">
                      <circle cx="12.5" cy="10.5" r="4" stroke="var(--stroke-0, white)" />
                    </g>
                    <defs>
                      <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="25" id="filter0_d_154_1889" width="25" x="0" y="0">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                        <feOffset dy="2" />
                        <feGaussianBlur stdDeviation="4" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                        <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_154_1889" />
                        <feBlend in="SourceGraphic" in2="effect1_dropShadow_154_1889" mode="normal" result="shape" />
                      </filter>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ColorAdjustment />
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[202px]">
      <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name=".swatches">
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#2196f3] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#9c27b0] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#ef5350] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#01579b] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#ba68c8] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#66bb6a] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#558b2f] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
      </div>
      <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name=".swatches">
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#0057b2] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#ff9800] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#ffecb3] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#a5d6a7] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#00c0d6] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#7b1fa2] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
        <div className="relative shrink-0 size-[16px]" data-name=".swatch">
          <div className="absolute bg-[#ea80fc] inset-0 rounded-[4px]" data-name="Swatch" />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
          <Frame6 />
        </div>
      </div>
    </div>
  );
}

export default function Frame8() {
  return (
    <div className="relative size-full">
      <div className="absolute left-0 rounded-[4px] top-0 w-[220px]" data-name="Color Picker">
        <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
          <SelectColor />
          <div className="content-stretch flex flex-col items-center overflow-clip relative rounded-bl-[4px] rounded-br-[4px] shrink-0 w-full" data-name=".palette">
            <div className="content-stretch flex flex-col h-px items-center justify-center relative shrink-0 w-full" data-name="Divider">
              <div className="h-0 relative shrink-0 w-full" data-name="line">
                <div className="absolute inset-[-0.5px_0]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 220 1">
                    <path d="M0 0.5H220" id="line" stroke="var(--stroke-0, black)" strokeOpacity="0.12" />
                  </svg>
                </div>
              </div>
            </div>
            <Frame5 />
          </div>
        </div>
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      </div>
    </div>
  );
}