import sharp from "sharp";
import { writeFileSync } from "fs";

const PW=44, PH=44;
function puzzlePath() {
  const w=PW, h=PH, r=5, tabR=8, tabX=w*0.5, tabY=h*0.5;
  return [
    `M ${r} 0`, `L ${tabX-tabR} 0`,
    `Q ${tabX} ${-tabR*0.6} ${tabX+tabR} 0`, `L ${w-r} 0`, `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${tabY-tabR}`, `Q ${w+tabR*0.7} ${tabY} ${w} ${tabY+tabR}`,
    `L ${w} ${h-r}`, `Q ${w} ${h} ${w-r} ${h}`, `L ${tabX+tabR} ${h}`,
    `Q ${tabX} ${h+tabR*0.6} ${tabX-tabR} ${h}`, `L ${r} ${h}`, `Q 0 ${h} 0 ${h-r}`,
    `L 0 ${r}`, `Q 0 0 ${r} 0`, "Z"
  ].join(" ");
}

// Just render the puzzle shape as white-on-black to see it
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}">
<rect width="${PW}" height="${PH}" fill="black"/>
<path d="${puzzlePath()}" fill="white"/>
</svg>`;
writeFileSync("scripts/test_mask_only.png", await sharp(Buffer.from(maskSvg)).png().toBuffer());

// Also render just the stroke
const strokeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}">
<rect width="${PW}" height="${PH}" fill="none"/>
<path d="${puzzlePath()}" fill="none" stroke="white" stroke-width="2"/>
</svg>`;
writeFileSync("scripts/test_stroke_only.png", await sharp(Buffer.from(strokeSvg)).png().toBuffer());

console.log("Mask and stroke images saved");
