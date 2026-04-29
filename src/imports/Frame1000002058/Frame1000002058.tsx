import svgPaths from "./svg-5dxczpv72k";
import imgBrandLogoBmw from "./cfe78815307074a2ddb466b691f701682a2b8e8a.png";
import imgThumbnail from "./a7db45ce5ec2bc6c67c2b4c79a3f5cbe80a77726.png";
import imgThumbnail1 from "./aefd339d0501936210f7f222e494cd30fba38200.png";
import imgThumbnail2 from "./a68f828053121b39f306d1b4f35e382e7a63ebf0.png";
import imgThumbnail3 from "./d711f75e493096cebb0aa9579abce0cd04e339c7.png";
import imgThumbnail4 from "./6abee879ede2f3e36501bf263576e2dd5fd1247a.png";
import imgThumbnail5 from "./0ff321504b68bfeaaffbd9e3a196888bf63d2387.png";
import imgThumbnail6 from "./0654d1a3e9deccdb283f45b0d7cbcd950688dd06.png";
import imgThumbnail7 from "./ce4d8a6bb5cf3e1b798b47524d59bf32c7305dff.png";

function LabelContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center pb-[4px] px-[4px] relative shrink-0 z-[3]" data-name="Label Container">
      <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#686576] text-[12px] text-left tracking-[0.15px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12px]">Brand Kit</p>
      </div>
    </div>
  );
}

function AutocompleteTag() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="AutocompleteTag">
      <div className="flex flex-row items-center size-full">
        <div className="content-center flex flex-wrap gap-[8px] items-center pr-[44px] relative size-full">
          <div className="bg-white overflow-clip relative rounded-[4px] shrink-0 size-[24px]" data-name="Negative=No">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute h-[144.56%] left-[-22.03%] max-w-none top-[-23.13%] w-[143.46%]" src={imgBrandLogoBmw} />
            </div>
          </div>
          <p className="flex-[1_0_0] font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] min-w-px overflow-hidden relative text-[#1f1d25] text-[12px] text-ellipsis text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            BMW
          </p>
        </div>
      </div>
    </div>
  );
}

function Container() {
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
      <div className="-translate-y-1/2 absolute content-stretch cursor-pointer flex items-start right-[24px] top-1/2" role="button" tabIndex="0" data-name="AutocompleteClose">
        <div className="overflow-clip relative shrink-0 size-[20px]" data-name="CloseFilled">
          <div className="absolute inset-[20.83%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6667 11.6667">
              <path d={svgPaths.p2a4bf680} fill="var(--fill-0, #111014)" fillOpacity="0.56" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelAmount() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Audi
      </p>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Audi">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-[-1.04%] max-w-none size-[102.08%] top-[-1.04%]" src={imgThumbnail} />
          </div>
        </div>
      </div>
      <LabelAmount />
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container2 />
        </div>
      </div>
    </div>
  );
}

function MenuItem() {
  return (
    <div className="content-stretch cursor-pointer flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" role="button" tabIndex="0" data-name="<MenuItem>">
      <Container1 />
    </div>
  );
}

function LabelAmount1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        BMW
      </p>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Negative=No">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[144.56%] left-[-22.03%] max-w-none top-[-23.13%] w-[143.46%]" src={imgBrandLogoBmw} />
        </div>
      </div>
      <LabelAmount1 />
    </div>
  );
}

function Container3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container4 />
        </div>
      </div>
    </div>
  );
}

function MenuItem1() {
  return (
    <div className="content-stretch cursor-pointer flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" role="button" tabIndex="0" data-name="<MenuItem>">
      <Container3 />
    </div>
  );
}

function LabelAmount2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Bentley
      </p>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Bentley">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-[5.36%] max-w-none size-[89.29%] top-[7.14%]" src={imgThumbnail1} />
          </div>
        </div>
      </div>
      <LabelAmount2 />
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container6 />
        </div>
      </div>
    </div>
  );
}

function MenuItem2() {
  return (
    <div className="content-stretch cursor-pointer flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" role="button" tabIndex="0" data-name="<MenuItem>">
      <Container5 />
    </div>
  );
}

function LabelAmount3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Buick
      </p>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Buick">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-[3.23%] max-w-none size-[93.55%] top-[3.23%]" src={imgThumbnail2} />
          </div>
        </div>
      </div>
      <LabelAmount3 />
    </div>
  );
}

function Container7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container8 />
        </div>
      </div>
    </div>
  );
}

function MenuItem3() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" data-name="<MenuItem>">
      <Container7 />
    </div>
  );
}

function LabelAmount4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Cadillac
      </p>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Cadillac">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-[11.68%] max-w-none size-[76.64%] top-[11.68%]" src={imgThumbnail3} />
          </div>
        </div>
      </div>
      <LabelAmount4 />
    </div>
  );
}

function Container9() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function MenuItem4() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" data-name="<MenuItem>">
      <Container9 />
    </div>
  );
}

function LabelAmount5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Ferrari
      </p>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Ferrari">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgThumbnail4} />
          </div>
        </div>
      </div>
      <LabelAmount5 />
    </div>
  );
}

function Container11() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container12 />
        </div>
      </div>
    </div>
  );
}

function MenuItem5() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" data-name="<MenuItem>">
      <Container11 />
    </div>
  );
}

function LabelAmount6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Ford
      </p>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Ford">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-[7.58%] max-w-none size-[84.85%] top-[7.58%]" src={imgThumbnail5} />
          </div>
        </div>
      </div>
      <LabelAmount6 />
    </div>
  );
}

function Container13() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container14 />
        </div>
      </div>
    </div>
  );
}

function MenuItem6() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" data-name="<MenuItem>">
      <Container13 />
    </div>
  );
}

function LabelAmount7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Honda
      </p>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Honda">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute left-[10%] max-w-none size-[80%] top-[10%]" src={imgThumbnail6} />
          </div>
        </div>
      </div>
      <LabelAmount7 />
    </div>
  );
}

function Container15() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container16 />
        </div>
      </div>
    </div>
  );
}

function MenuItem7() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" data-name="<MenuItem>">
      <Container15 />
    </div>
  );
}

function LabelAmount8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-w-px relative" data-name="Label + Amount">
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[1.43] relative shrink-0 text-[#1f1d25] text-[12px] text-left tracking-[0.17px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Jeep
      </p>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Container">
      <div className="bg-white content-stretch flex items-center justify-center overflow-clip relative rounded-[4px] shrink-0 size-[20px]" data-name="Brand Logo/Jeep">
        <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Thumbnail">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute h-[35.12%] left-[12.16%] max-w-none top-[32.44%] w-[75.68%]" src={imgThumbnail7} />
          </div>
        </div>
      </div>
      <LabelAmount8 />
    </div>
  );
}

function Container17() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center pl-[16px] pr-[4px] py-[4px] relative size-full">
          <Container18 />
        </div>
      </div>
    </div>
  );
}

function MenuItem8() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center min-h-[36px] relative shrink-0 w-full" data-name="<MenuItem>">
      <Container17 />
    </div>
  );
}

function MenuList() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-start min-w-px py-[8px] relative" data-name="<MenuList>">
      <MenuItem />
      <MenuItem1 />
      <MenuItem2 />
      <MenuItem3 />
      <MenuItem4 />
      <MenuItem5 />
      <MenuItem6 />
      <MenuItem7 />
      <MenuItem8 />
    </div>
  );
}

function Paper() {
  return (
    <div className="content-stretch flex items-start overflow-clip relative rounded-[4px] shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)] shrink-0 w-full" data-name="<Paper>">
      <MenuList />
    </div>
  );
}

function Menu() {
  return (
    <div className="absolute bottom-[-141px] content-stretch flex flex-col h-[141px] items-start left-0 right-0" data-name="<Menu>">
      <Paper />
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f9fafa] relative rounded-[4px] shrink-0 w-full z-[2]" data-name="Input">
      <div aria-hidden="true" className="absolute border-2 border-[rgba(99,86,225,0.7)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="content-stretch flex flex-col items-start pl-[8px] pr-[4px] relative size-full">
        <Container />
        <Menu />
      </div>
    </div>
  );
}

function Select() {
  return (
    <div className="content-stretch flex flex-col isolate items-start relative shrink-0 w-full" data-name="<Select>">
      <LabelContainer />
      <Input />
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

export default function Frame() {
  return (
    <div className="relative size-full">
      <button className="absolute content-stretch cursor-pointer flex flex-col items-start left-0 top-0 w-[265.25px]" data-name="Brand Kit">
        <Autocomplete />
      </button>
    </div>
  );
}