import svgPaths from "./svg-i9peqlmvky";

function Container1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[9px] relative shrink-0" data-name="Container">
      <p className="capitalize font-['Roboto:Medium',sans-serif] font-medium leading-[24px] relative shrink-0 text-[#473bab] text-[14px] tracking-[0.4px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Template
      </p>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[9px] relative shrink-0" data-name="Container">
      <p className="capitalize font-['Roboto:Medium',sans-serif] font-medium leading-[24px] relative shrink-0 text-[#686576] text-[14px] tracking-[0.4px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Components
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
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 94 2">
              <line id="Line" stroke="var(--stroke-0, #473BAB)" strokeWidth="2" x2="94" y1="1" y2="1" />
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

function MinHeight() {
  return <div className="h-px w-0" data-name="min-height" />;
}

function LabelContainer() {
  return (
    <div className="content-stretch flex font-['Roboto:Regular',sans-serif] font-normal gap-[2px] items-center leading-[0] px-[4px] relative shrink-0 text-[12px] tracking-[0.15px] whitespace-nowrap" data-name="Label Container">
      <div className="flex flex-col justify-center relative shrink-0 text-[#d2323f]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">*</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#686576]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Template Name</p>
      </div>
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex h-[36px] items-center justify-end min-h-[36px] min-w-[24px] py-[6px] relative shrink-0 w-full" data-name="Content">
      <p className="flex-[1_0_0] font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] min-w-px relative text-[#1f1d25] text-[12px] tracking-[0.17px]" style={{ fontVariationSettings: "'wdth' 100" }}>{`{default template name}`}</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
          <Content />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#dddce0] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function LabelContainer1() {
  return (
    <div className="content-stretch flex font-['Roboto:Regular',sans-serif] font-normal gap-[2px] items-center leading-[0] px-[4px] relative shrink-0 text-[12px] tracking-[0.15px] whitespace-nowrap" data-name="Label Container">
      <div className="flex flex-col justify-center relative shrink-0 text-[#d2323f]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">*</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#686576]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Template Type</p>
      </div>
    </div>
  );
}

function MinHeight1() {
  return <div className="h-[24px] shrink-0 w-0" data-name="min-height" />;
}

function MinWidth() {
  return <div className="h-0 shrink-0 w-[24px]" data-name="min-width" />;
}

function Container3() {
  return (
    <div className="content-stretch flex items-center overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <MinHeight1 />
      <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1f1d25] text-[12px] tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.43]">Non-HTML</p>
      </div>
      <MinWidth />
      <div className="-translate-y-1/2 absolute overflow-clip right-0 size-[24px] top-1/2" data-name="chevron-down-small">
        <div className="absolute flex inset-[41.67%_33.33%] items-center justify-center" style={{ containerType: "size" }}>
          <div className="-rotate-180 -scale-x-100 flex-none h-[100cqh] w-[100cqw]">
            <div className="relative size-full" data-name="vector">
              <div className="absolute inset-[-35.36%_-17.68%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.8284 6.82843">
                  <path d={svgPaths.p141c0d00} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="square" strokeOpacity="0.56" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#dddce0] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
        <Container3 />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] isolate items-start relative shrink-0 w-full z-[2]">
      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full z-[2]" data-name="<TextField>">
        <LabelContainer />
        <Input />
      </div>
      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full z-[1]" data-name="<Select>">
        <LabelContainer1 />
        <Input1 />
      </div>
    </div>
  );
}

function LabelContainer2() {
  return (
    <div className="content-stretch flex font-['Roboto:Regular',sans-serif] font-normal gap-[2px] items-center leading-[0] px-[4px] relative shrink-0 text-[12px] tracking-[0.15px] whitespace-nowrap z-[3]" data-name="Label Container">
      <div className="flex flex-col justify-center relative shrink-0 text-[#d2323f]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">*</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#686576]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Asset Type *</p>
      </div>
    </div>
  );
}

function MinHeight2() {
  return <div className="h-[24px] shrink-0 w-0" data-name="min-height" />;
}

function MinWidth1() {
  return <div className="h-0 shrink-0 w-[24px]" data-name="min-width" />;
}

function Container4() {
  return (
    <div className="content-stretch flex items-center overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <MinHeight2 />
      <MinWidth1 />
      <div className="-translate-y-1/2 absolute overflow-clip right-0 size-[24px] top-1/2" data-name="chevron-down-small">
        <div className="absolute flex inset-[41.67%_33.33%] items-center justify-center" style={{ containerType: "size" }}>
          <div className="-rotate-180 -scale-x-100 flex-none h-[100cqh] w-[100cqw]">
            <div className="relative size-full" data-name="vector">
              <div className="absolute inset-[-35.36%_-17.68%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.8284 6.82843">
                  <path d={svgPaths.p141c0d00} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="square" strokeOpacity="0.56" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full z-[2]" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
        <Container4 />
      </div>
    </div>
  );
}

function LabelContainer3() {
  return (
    <div className="content-stretch flex gap-[4px] items-center pb-[4px] px-[4px] relative shrink-0" data-name="Label Container">
      <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#686576] text-[12px] text-left tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Brand</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex h-[36px] items-center min-h-[36px] overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <div className="-translate-y-1/2 absolute overflow-clip right-0 size-[24px] top-1/2" data-name="chevron-down-small">
        <div className="absolute inset-[41.67%_33.33%_42.96%_33.33%]" data-name="vector">
          <div className="absolute inset-[-27.11%_-12.5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 5.68934">
              <path d={svgPaths.p382fd600} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      <div className="-translate-y-1/2 absolute content-stretch flex items-start right-[24px] size-[20px] top-1/2" data-name="AutocompleteClose" />
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start pl-[8px] pr-[4px] relative size-full">
        <Container5 />
      </div>
    </div>
  );
}

function Select() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Select>">
      <LabelContainer3 />
      <Input3 />
    </div>
  );
}

function Autocomplete() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Autocomplete>">
      <Select />
    </div>
  );
}

function LabelContainer4() {
  return (
    <div className="content-stretch flex gap-[4px] items-center pb-[4px] px-[4px] relative shrink-0" data-name="Label Container">
      <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#686576] text-[12px] text-left tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Accounts</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex h-[36px] items-center min-h-[36px] overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <div className="-translate-y-1/2 absolute overflow-clip right-0 size-[24px] top-1/2" data-name="chevron-down-small">
        <div className="absolute inset-[41.67%_33.33%_42.96%_33.33%]" data-name="vector">
          <div className="absolute inset-[-27.11%_-12.5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 5.68934">
              <path d={svgPaths.p382fd600} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      <div className="-translate-y-1/2 absolute content-stretch flex items-start right-[24px] size-[20px] top-1/2" data-name="AutocompleteClose" />
    </div>
  );
}

function Input4() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start pl-[8px] pr-[4px] relative size-full">
        <Container6 />
      </div>
    </div>
  );
}

function Select1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Select>">
      <LabelContainer4 />
      <Input4 />
    </div>
  );
}

function Autocomplete1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Autocomplete>">
      <Select1 />
    </div>
  );
}

function Padding() {
  return (
    <div className="content-stretch flex items-center p-[9px] relative rounded-[100px] shrink-0" data-name="Padding">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="_hidden">
        <div className="absolute inset-[8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6667 16.6667">
            <path d={svgPaths.p382f9640} fill="var(--fill-0, #6356E1)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Padding1() {
  return (
    <div className="content-stretch flex items-center p-[9px] relative rounded-[100px] shrink-0" data-name="Padding">
      <div className="overflow-clip relative shrink-0 size-[20px]" data-name="_hidden">
        <div className="absolute inset-[8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6667 16.6667">
            <path d={svgPaths.p5973800} fill="var(--fill-0, #686576)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-center relative shrink-0" data-name="<FormControlLabel> | Radio">
        <div className="content-stretch flex items-center overflow-clip relative shrink-0" data-name="<Radio>">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[15px] top-1/2">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
              <circle cx="7.5" cy="7.5" fill="var(--fill-0, #F0F2F4)" id="Ellipse 1" r="7.5" />
            </svg>
          </div>
          <Padding />
        </div>
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="<FormLabel>">
          <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#1f1d25] text-[14px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            Static
          </p>
        </div>
      </div>
      <div className="content-stretch flex items-center relative shrink-0" data-name="<FormControlLabel> | Radio">
        <div className="content-stretch flex items-center overflow-clip relative shrink-0" data-name="<Radio>">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[15px] top-1/2">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
              <circle cx="7.5" cy="7.5" fill="var(--fill-0, #F0F2F4)" id="Ellipse 1" r="7.5" />
            </svg>
          </div>
          <Padding1 />
        </div>
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="<FormLabel>">
          <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#1f1d25] text-[14px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            Video
          </p>
        </div>
      </div>
    </div>
  );
}

function RadioGroup() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<RadioGroup>">
      <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="<FormLabel>">
        <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[#1f1d25] text-[14px] tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Format
        </p>
      </div>
      <Frame7 />
    </div>
  );
}

function LabelContainer5() {
  return (
    <div className="content-stretch flex gap-[4px] items-center pb-[4px] px-[4px] relative shrink-0" data-name="Label Container">
      <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#686576] text-[12px] text-left tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Dimensions</p>
      </div>
    </div>
  );
}

function AutocompleteTag() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="AutocompleteTag">
      <div className="flex flex-row items-center size-full">
        <div className="content-center flex flex-wrap gap-[8px] items-center pr-[24px] relative size-full">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="filled=off, stroke=1.5, radius=1, join=round">
            <div className="absolute inset-[11.46%_19.79%]" data-name="vector">
              <div className="absolute inset-[-4.05%_-5.17%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 20">
                  <path d={svgPaths.p7ab6e80} id="vector" stroke="var(--stroke-0, #473BAB)" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
          <p className="flex-[1_0_0] font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] min-w-px overflow-hidden relative text-[#1f1d25] text-[12px] text-ellipsis text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            Custom
          </p>
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex items-center min-h-[36px] overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <AutocompleteTag />
      <div className="-translate-y-1/2 absolute overflow-clip right-0 size-[24px] top-1/2" data-name="chevron-down-small">
        <div className="absolute inset-[41.67%_33.33%_42.96%_33.33%]" data-name="vector">
          <div className="absolute inset-[-27.11%_-12.5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 5.68934">
              <path d={svgPaths.p382fd600} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input5() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start pl-[8px] pr-[4px] relative size-full">
        <Container7 />
      </div>
    </div>
  );
}

function Select2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Select>">
      <LabelContainer5 />
      <Input5 />
    </div>
  );
}

function Autocomplete2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full z-[1]" data-name="<Autocomplete>">
      <Select2 />
    </div>
  );
}

function Content1() {
  return (
    <div className="content-stretch flex items-center justify-end min-h-[24px] min-w-[24px] relative shrink-0 w-full" data-name="Content">
      <p className="flex-[1_0_0] font-['Roboto:Regular',sans-serif] font-normal leading-[24px] min-w-px relative text-[#1f1d25] text-[12px] text-center tracking-[0.15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        W
      </p>
    </div>
  );
}

function Input6() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start overflow-clip relative shrink-0 w-full" data-name="Input">
      <Content1 />
    </div>
  );
}

function MinHeight3() {
  return <div className="h-[24px] shrink-0 w-0" data-name="min-height" />;
}

function MinWidth2() {
  return <div className="h-0 shrink-0 w-[24px]" data-name="min-width" />;
}

function Container8() {
  return (
    <div className="content-stretch flex items-center overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <MinHeight3 />
      <MinWidth2 />
    </div>
  );
}

function Input7() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
        <Container8 />
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-w-px relative">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[40px]" data-name="<TextField>">
        <Input6 />
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative" data-name="<Select>">
        <Input7 />
      </div>
    </div>
  );
}

function Content2() {
  return (
    <div className="content-stretch flex items-center justify-end min-h-[24px] min-w-[24px] relative shrink-0 w-full" data-name="Content">
      <p className="flex-[1_0_0] font-['Roboto:Regular',sans-serif] font-normal leading-[24px] min-w-px relative text-[#1f1d25] text-[12px] text-center tracking-[0.15px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        H
      </p>
    </div>
  );
}

function Input8() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start overflow-clip relative shrink-0 w-full" data-name="Input">
      <Content2 />
    </div>
  );
}

function MinHeight4() {
  return <div className="h-[24px] shrink-0 w-0" data-name="min-height" />;
}

function MinWidth3() {
  return <div className="h-0 shrink-0 w-[24px]" data-name="min-width" />;
}

function Container9() {
  return (
    <div className="content-stretch flex items-center overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <MinHeight4 />
      <MinWidth3 />
    </div>
  );
}

function Input9() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start px-[8px] relative size-full">
        <Container9 />
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-w-px relative">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[40px]" data-name="<TextField>">
        <Input8 />
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-center justify-center min-w-px relative" data-name="<Select>">
        <Input9 />
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame1 />
    </div>
  );
}

function Dimensions() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative rounded-[8px] shrink-0 w-full" data-name="Dimensions">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Panel Assets / Dimensions">
        <button className="content-stretch cursor-pointer flex flex-col isolate items-start relative shrink-0 w-full" data-name="Autocomplete 2.0">
          <Autocomplete2 />
        </button>
      </div>
      <Frame2 />
    </div>
  );
}

function Name() {
  return (
    <div className="flex-[1_0_0] min-w-px relative rounded-[4px]" data-name="Name">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[4px] relative size-full">
          <div className="flex flex-col font-['Roboto:Medium',sans-serif] font-medium justify-center leading-[0] overflow-hidden relative shrink-0 text-[#1f1d25] text-[14px] text-ellipsis tracking-[0.1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[1.57] overflow-hidden text-ellipsis">Metadata</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-px items-center min-w-px relative">
      <Name />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <div className="content-stretch flex items-center py-[4px] relative rounded-[8px] shrink-0 w-[118px]" data-name="Panel Assets / Layer Name">
        <Frame5 />
      </div>
    </div>
  );
}

function TItle() {
  return (
    <div className="relative shrink-0 w-full" data-name="TItle">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between pr-[8px] relative size-full">
          <Frame6 />
        </div>
      </div>
    </div>
  );
}

function LabelContainer6() {
  return (
    <div className="content-stretch flex gap-[4px] items-center pb-[4px] px-[4px] relative shrink-0" data-name="Label Container">
      <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#686576] text-[12px] text-left tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Tags</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex h-[36px] items-center min-h-[36px] overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <div className="-translate-y-1/2 absolute overflow-clip right-0 size-[24px] top-1/2" data-name="chevron-down-small">
        <div className="absolute inset-[41.67%_33.33%_42.96%_33.33%]" data-name="vector">
          <div className="absolute inset-[-27.11%_-12.5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 5.68934">
              <path d={svgPaths.p382fd600} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      <div className="-translate-y-1/2 absolute content-stretch flex items-start right-[24px] size-[20px] top-1/2" data-name="AutocompleteClose" />
    </div>
  );
}

function Input10() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start pl-[8px] pr-[4px] relative size-full">
        <Container10 />
      </div>
    </div>
  );
}

function Select3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Select>">
      <LabelContainer6 />
      <Input10 />
    </div>
  );
}

function Autocomplete3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Autocomplete>">
      <Select3 />
    </div>
  );
}

function LabelContainer7() {
  return (
    <div className="content-stretch flex gap-[4px] items-center pb-[4px] px-[4px] relative shrink-0" data-name="Label Container">
      <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#686576] text-[12px] text-left tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Offer Types</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex h-[36px] items-center min-h-[36px] overflow-clip py-[6px] relative shrink-0 w-full" data-name="Container">
      <div className="-translate-y-1/2 absolute overflow-clip right-0 size-[24px] top-1/2" data-name="chevron-down-small">
        <div className="absolute inset-[41.67%_33.33%_42.96%_33.33%]" data-name="vector">
          <div className="absolute inset-[-27.11%_-12.5%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 5.68934">
              <path d={svgPaths.p382fd600} id="vector" stroke="var(--stroke-0, #111014)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.56" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      <div className="-translate-y-1/2 absolute content-stretch flex items-start right-[24px] size-[20px] top-1/2" data-name="AutocompleteClose" />
    </div>
  );
}

function Input11() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#cac9cf] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start pl-[8px] pr-[4px] relative size-full">
        <Container11 />
      </div>
    </div>
  );
}

function Select4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Select>">
      <LabelContainer7 />
      <Input11 />
    </div>
  );
}

function Autocomplete4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Autocomplete>">
      <Select4 />
    </div>
  );
}

function MaskedIcon() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Masked Icon">
      <div className="absolute left-[-2px] overflow-clip size-[18px] top-0" data-name="filled=off, stroke=1.5, radius=1, join=round">
        <div className="absolute inset-[28.13%]" data-name="vector">
          <div className="absolute inset-[-9.52%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.375 9.375">
              <path d={svgPaths.p30d25e80} id="vector" stroke="var(--stroke-0, #473BAB)" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Base() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-name="Base">
      <MaskedIcon />
      <p className="capitalize font-['Roboto:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#473bab] text-[13px] tracking-[0.46px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Add Field
      </p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="relative rounded-[12px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.12)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col gap-[12px] items-start p-[12px] relative size-full">
        <TItle />
        <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Autocomplete 2.0">
          <Autocomplete3 />
        </button>
        <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Autocomplete 2.0">
          <Autocomplete4 />
        </button>
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip px-[5px] py-[4px] relative rounded-[100px] shrink-0" data-name="<Button>">
          <Base />
        </div>
      </div>
    </div>
  );
}

export default function Frame8() {
  return (
    <div className="relative size-full">
      <div className="absolute content-stretch flex flex-col gap-[12px] isolate items-start left-0 pb-[4px] pt-[8px] top-0 w-[248px]" data-name="Settings 2.0">
        <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full z-[3]" data-name="<Tabs>">
          <Container />
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="<Divider> | Horizontal">
            <div className="flex items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "0" } as React.CSSProperties}>
              <div className="flex-none scale-x-0 scale-y-[NaN%] skew-x-[NaNdeg] skew-y-[NaNdeg]">
                <MinHeight />
              </div>
            </div>
            <div className="h-0 relative shrink-0 w-full" data-name="Divider">
              <div className="absolute inset-[-1px_0_0_0]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 248 1">
                  <line id="Divider" stroke="var(--stroke-0, black)" strokeOpacity="0.12" x2="248" y1="0.5" y2="0.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <Frame3 />
        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-[248px] z-[1]" data-name="Template Format">
          <div className="content-stretch flex flex-col gap-[4px] isolate items-start relative shrink-0 w-full" data-name="<Select>">
            <LabelContainer2 />
            <Input2 />
          </div>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Autocomplete 2.0">
            <Autocomplete />
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Autocomplete 2.0">
            <Autocomplete1 />
          </button>
          <RadioGroup />
          <Dimensions />
          <Frame4 />
        </div>
      </div>
    </div>
  );
}