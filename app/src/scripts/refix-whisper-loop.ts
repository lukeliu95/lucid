/** 修 whisper 循环幻觉的视频:-mc 0 重转写缓存音频 → 全管线重跑 → S5。
 * 运行:DOTENV_CONFIG_PATH=.env.local REFIX_VID=<platform_id> tsx --conditions=react-server src/scripts/refix-whisper-loop.ts */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { readSrtFile } from "@/lib/i18n-asr";
import { runPipeline } from "@/lib/ai/pipeline";
import { aggregatePerson } from "@/lib/ai/prompts/s5-person";
const MODEL = `${process.env.HOME}/.cache/hyperframes/whisper/models/ggml-large-v3.bin`;
const VID = process.env.REFIX_VID!;
const WAV = `/tmp/lucid-whisper/${VID}.16k.wav`;
const OUT = `/tmp/lucid-whisper/${VID}.fixed2`;
async function retry<T>(fn:()=>Promise<T>,n=4):Promise<T>{let e;for(let i=0;i<n;i++){try{return await fn()}catch(x){e=x;await new Promise(r=>setTimeout(r,(i+1)*2000))}}throw e}
(async()=>{
  if(!fs.existsSync(WAV)){console.error("wav 缺失:",WAV);process.exit(1)}
  console.log(`重转写 ${VID}(-mc 0 抗循环)...`);
  const r=spawnSync("whisper-cli",["-m",MODEL,"-l","zh","-mc","0","-et","2.8","-osrt","-of",OUT,"-t","8",WAV],{encoding:"utf8",maxBuffer:1<<28});
  if(r.status!==0){console.error("whisper 失败");process.exit(1)}
  const raw=fs.readFileSync(OUT+".srt","utf-8");
  const segs=await readSrtFile(OUT+".srt");
  console.log("段数:",segs.length);
  const v:any=(await retry(()=>db.select().from(schema.videos).where(eq(schema.videos.platform_id,VID)).limit(1)))[0];
  await runPipeline({video_id:v.id,video_title:v.title_zh,srt:segs});
  const p:any=(await retry(()=>db.select().from(schema.people).where(eq(schema.people.id,v.person_id)).limit(1)))[0];
  const rows=await retry(()=>db.select().from(schema.videos).innerJoin(schema.videos_ai,eq(schema.videos.id,schema.videos_ai.video_id)).where(eq(schema.videos.person_id,v.person_id)));
  const s5=await aggregatePerson({person_name_zh:p.name_zh,person_name_en:p.name_en,videos:rows.map((x:any)=>({slug:x.videos.slug,title_zh:x.videos.title_zh,title_en:x.videos.title_en,keypoints_zh:x.videos_ai.keypoints_zh.map((k:any)=>({text:k.text})),keypoints_en:x.videos_ai.keypoints_en.map((k:any)=>({text:k.text}))}))});
  await retry(()=>db.update(schema.people).set({signature_views_zh:s5.signature_views_zh,signature_views_en:s5.signature_views_en}).where(eq(schema.people.id,p.id)));
  console.log(`✓ ${p.name_zh} 重处理完成 · 新时间轴 ${ (await retry(()=>db.select({t:schema.videos_ai.timeline_zh}).from(schema.videos_ai).where(eq(schema.videos_ai.video_id,v.id)).limit(1)))[0].t.length } 段 · S5 ${s5.signature_views_zh.length} 条`);
})().then(()=>process.exit(0)).catch(e=>{console.error(String(e));process.exit(1)});
