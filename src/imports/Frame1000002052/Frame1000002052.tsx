import svgPaths from "./svg-579ouhj437";

function Albums() {
  return (
    <div className="absolute inset-[4.17%_4.86%_6.94%_6.25%]" data-name="albums">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.3333 21.3333">
        <g id="albums">
          <path d={svgPaths.p33b0c580} id="Vector" stroke="var(--stroke-0, #686576)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function LeftSlot() {
  return (
    <div className="content-stretch flex flex-col items-start min-w-[36px] relative shrink-0" data-name="Left Slot">
      <div className="relative shrink-0 size-[24px]" data-name="Filled=No">
        <Albums />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Container">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#1f1d25] text-[14px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Portal
      </p>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex items-center overflow-clip px-[16px] py-[6px] relative shrink-0" data-name="Container">
      <LeftSlot />
      <Container1 />
    </div>
  );
}

function LeftSlot1() {
  return (
    <div className="content-stretch flex flex-col items-start min-w-[36px] relative shrink-0" data-name="Left Slot">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="filled=off, stroke=1.5, radius=1, join=round">
        <div className="absolute inset-[15.63%]" data-name="vector">
          <div className="absolute inset-[-4.55%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
              <path d={svgPaths.p114f0480} id="vector" stroke="var(--stroke-0, #686576)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Container">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#1f1d25] text-[14px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Upload
      </p>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-center overflow-clip px-[16px] py-[6px] relative shrink-0" data-name="Container">
      <LeftSlot1 />
      <Container3 />
    </div>
  );
}

function MenuList() {
  return (
    <div className="content-stretch flex flex-col items-start py-[8px] relative rounded-[4px] shrink-0 w-full" data-name="<MenuList>">
      <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Portal">
        <Container />
      </div>
      <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Upload">
        <Container2 />
      </div>
    </div>
  );
}

function Paper() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[4px] shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)] shrink-0 w-full" data-name="<Paper>">
      <MenuList />
    </div>
  );
}

function Menu() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[220px]" data-name="<Menu>">
      <Paper />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <div className="absolute content-stretch flex flex-col items-start left-0 top-0" data-name="Upload Section / Menu">
        <Menu />
      </div>
    </div>
  );
}