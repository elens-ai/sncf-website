// Register copy and media at their source, preserving component structure and safe React escaping.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {parse}=require('@babel/parser');
const root=path.resolve(__dirname,'..');
const copyFile=path.join(root,'src/cms/generatedCopy.json'),assetFile=path.join(root,'src/cms/generatedAssets.json');
const copy=fs.existsSync(copyFile)?JSON.parse(fs.readFileSync(copyFile,'utf8')):{},assets=fs.existsSync(assetFile)?JSON.parse(fs.readFileSync(assetFile,'utf8')):{};
const textProps=new Set(['alt','title','placeholder','aria-label','eyebrow','standfirst','label','caption','description','headline','subtitle','heading','body','name','subText','shortTagline','text','k','v','year','line','scope','period','quote','attribution','role','tag']);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,12);
const clean=value=>value.split(/\r?\n/).map((line,i,lines)=>{line=line.replace(/\t/g,' ');if(i>0)line=line.trimStart();if(i<lines.length-1)line=line.trimEnd();return line;}).filter(Boolean).join(' ');
let files=0;
for(const folder of ['src/components','src/pages'])for(const filename of fs.readdirSync(path.join(root,folder))){
 if(!filename.endsWith('.tsx'))continue;
 const file=path.join(folder,filename);let source=fs.readFileSync(path.join(root,file),'utf8');
 const ast=parse(source,{sourceType:'module',plugins:['typescript','jsx']});const edits=[];let usesCopy=false,usesAssets=false,usesLinks=false,usesMedia=false;
 function register(node,value,media,jsx){
  if(!value||(!media&&!/[\p{L}\p{N}]/u.test(value)))return;
  const key=(media?'asset.':'copy.')+filename.replace(/\.tsx$/,'')+'.'+hash(value);
  if(media){assets[key]={source:value,label:filename.replace('.tsx','')+' · '+value.split('/').pop()};usesAssets=true;}else{copy[key]=value;usesCopy=true;}
  const call=`${media?'resolveCMSAsset':'getCMSCopy'}(${JSON.stringify(key)}, ${JSON.stringify(value)})`;
  edits.push({start:node.start,end:node.end,value:jsx?'{'+call+'}':call});
 }
 function walk(node,parent){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&['getCMSCopy','resolveCMSAsset','getCMSLink','resolveCMSMedia'].includes(node.callee?.name))return;
  if(node.type==='JSXText'){register(node,clean(node.value),false,true);return;}
  if(node.type==='JSXAttribute'&&['src','poster'].includes(node.name?.name)&&node.value?.type==='JSXExpressionContainer'){
   const expression=node.value.expression;
   if(expression.type!=='StringLiteral'&&!['resolveCMSAsset','resolveCMSMedia'].includes(expression.callee?.name)){
    const original=source.slice(expression.start,expression.end);
    usesMedia=true;edits.push({start:expression.start,end:expression.end,value:`resolveCMSMedia(${original})`});return;
   }
  }
  if(node.type==='StringLiteral'){
   if((parent?.type==='JSXAttribute'&&['href','to'].includes(parent.name?.name))||(parent?.type==='ObjectProperty'&&parent.value===node&&parent.key?.name==='href')){
    const key='copy.Link.'+filename.replace(/\.tsx$/,'')+'.'+hash(node.value);copy[key]=node.value;usesLinks=true;
    const call=`getCMSLink(${JSON.stringify(key)}, ${JSON.stringify(node.value)})`;
    edits.push({start:node.start,end:node.end,value:parent.type==='JSXAttribute'?'{'+call+'}':call});return;
   }

   if(/^(?:\/images\/|\/video\/|\/models\/|\/audio\/|https?:\/\/[^\s]+\.(?:webp|png|jpe?g|svg|mp4|webm|mp3|wav|glb)(?:[?#].*)?$)/i.test(node.value)){register(node,node.value,true,parent?.type==='JSXAttribute');return;}
   if(parent?.type==='JSXAttribute'&&parent.name?.name!=='role'&&textProps.has(parent.name?.name)){register(node,node.value,false,true);return;}
   if(parent?.type==='ObjectProperty'&&parent.value===node&&textProps.has(parent.key?.name)){register(node,node.value,false,false);return;}
   if(parent?.type==='CallExpression'&&parent.arguments?.[0]===node&&parent.callee?.property?.name==='fillText'){register(node,node.value,false,false);return;}
   if(parent?.type==='JSXExpressionContainer'){register(node,node.value,false,false);return;}
  }
  for(const [key,value] of Object.entries(node)){if(['loc','start','end','extra','comments','tokens'].includes(key))continue;if(Array.isArray(value))value.forEach(child=>walk(child,node));else if(value&&typeof value==='object')walk(value,node);}
 }
 walk(ast,null);
 if(!edits.length)continue;
 edits.sort((a,b)=>b.start-a.start).forEach(e=>{source=source.slice(0,e.start)+e.value+source.slice(e.end);});
 if(usesMedia&&!source.includes("from '../cms/media'"))source="import { resolveCMSMedia } from '../cms/media';\n"+source;
 if(usesLinks&&!source.includes("from '../cms/links'"))source="import { getCMSLink } from '../cms/links';\n"+source;
 const imports=[usesCopy?'getCMSCopy':null,usesAssets?'resolveCMSAsset':null].filter(Boolean).join(', ');
 if(imports){
 const existing=source.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\.\/cms\/runtime['"];?\n/);
 if(existing){const names=[...new Set([...existing[1].split(',').map(x=>x.trim()),...imports.split(',').map(x=>x.trim())])];source=source.replace(existing[0],`import { ${names.join(', ')} } from '../cms/runtime';\n`);}else source=`import { ${imports} } from '../cms/runtime';\n`+source;
 }
 fs.writeFileSync(path.join(root,file),source);files++;
}
fs.writeFileSync(copyFile,JSON.stringify(copy,null,2)+'\n');fs.writeFileSync(assetFile,JSON.stringify(assets,null,2)+'\n');
console.log(JSON.stringify({files,copySlots:Object.keys(copy).length,assetSlots:Object.keys(assets).length}));
