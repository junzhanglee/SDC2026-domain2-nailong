import {parseCSV} from './engine.js?v=20261023-customer3';
const MAX_FILE=1024*1024,MAX_EXPANDED=4*1024*1024;
const aliases={name:'name',姓名:'name',team:'team',部门:'team',团队:'team',skill:'skill',技能:'skill',capacity:'capacity',可用工时:'capacity',可用小时:'capacity'};
export function tableRowsToEmployees(rows){
  if(!rows.length)throw Error('工作表为空。');
  const headers=rows[0].map(v=>aliases[String(v??'').replace(/^\uFEFF/,'').trim().toLowerCase()]||String(v??'').trim());
  if(new Set(headers.filter(Boolean)).size!==headers.filter(Boolean).length)throw Error('表头不能重复。');
  const nonempty=rows.slice(1).filter(row=>row.some(v=>String(v??'').trim()));
  const csv=[headers,...nonempty].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');
  return parseCSV(csv);
}
export async function unpackWorkbook(bytes){
  if(bytes.byteLength>MAX_FILE)throw Error('表格请控制在 1 MB 内。');
  const {unzipSync,strFromU8}=await import('./vendor/fflate.js');let total=0,entries=0;
  let files;
  try{files=unzipSync(bytes,{filter(info){
    if(++entries>1000)throw Error('ZIP_LIMIT');
    if(info.name.includes('..')||info.name.startsWith('/')||info.name.includes('\\'))throw Error('ZIP_PATH');
    const wanted=info.name==='xl/workbook.xml'||info.name==='xl/_rels/workbook.xml.rels'||info.name==='xl/sharedStrings.xml'||/^xl\/worksheets\/sheet[^/]*\.xml$/.test(info.name);
    if(wanted){total+=info.originalSize;if(total>MAX_EXPANDED||info.originalSize>MAX_EXPANDED)throw Error('ZIP_LIMIT');}
    return wanted;
  }});}catch{throw Error('Excel 文件损坏、被加密，或解压后过大。请另存为简单的 .xlsx 文件。');}
  const text={};for(const [name,bytes]of Object.entries(files))text[name]=strFromU8(bytes);
  if(!text['xl/workbook.xml']||!text['xl/_rels/workbook.xml.rels'])throw Error('这不是有效的 Excel .xlsx 工作簿。');
  return text;
}
function xml(text){if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('不支持带有外部实体的工作簿。');const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('工作簿 XML 数据损坏。');return doc;}
const nodes=(doc,name)=>Array.from(doc.getElementsByTagNameNS('*',name));
const textOf=doc=>nodes(doc,'t').map(x=>x.textContent).join('');
export function workbookRows(files){
  const workbook=xml(files['xl/workbook.xml']),rels=xml(files['xl/_rels/workbook.xml.rels']);
  const sheet=nodes(workbook,'sheet').find(x=>!['hidden','veryHidden'].includes(x.getAttribute('state')));if(!sheet)throw Error('工作簿没有可见工作表。');
  const id=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sheet.getAttribute('r:id');
  const rel=nodes(rels,'Relationship').find(x=>x.getAttribute('Id')===id);if(!rel||rel.getAttribute('TargetMode')==='External')throw Error('工作表关联无效。');
  const path=new URL(rel.getAttribute('Target'),'https://workbook.invalid/xl/').pathname.slice(1);
  if(!/^xl\/worksheets\/sheet[^/]*\.xml$/.test(path)||!files[path])throw Error('工作表文件缺失或格式不支持。');
  const strings=files['xl/sharedStrings.xml']?nodes(xml(files['xl/sharedStrings.xml']),'si').map(textOf):[];
  const rows=[];
  for(const row of nodes(xml(files[path]),'row')){
    const values=[];
    for(const c of nodes(row,'c')){
      if(nodes(c,'f').length)throw Error('导入区域包含公式。请先在 Excel 中复制并粘贴为值，再上传。');
      const ref=c.getAttribute('r'),match=/^([A-Z]+)\d+$/.exec(ref||'');if(!match)throw Error('单元格位置无效。');
      let col=0;for(const letter of match[1])col=col*26+letter.charCodeAt(0)-64;if(col>50)throw Error('请仅保留所需员工字段，最多 50 列。');
      const type=c.getAttribute('t'),raw=nodes(c,'v')[0]?.textContent??'';
      let value=type==='inlineStr'?textOf(c):type==='s'?strings[Number(raw)]:raw;
      if(type==='e'||value===undefined)throw Error('工作表存在错误单元格。');
      values[col-1]=value;
    }
    if(values.some(v=>String(v??'').trim()))rows.push(Array.from({length:values.length},(_,i)=>values[i]??''));
    if(rows.length>201)throw Error('每次最多分析 200 行员工资料。');
  }
  return {name:sheet.getAttribute('name'),rows};
}
export async function readHRTable(file){
  if(file.size>MAX_FILE)throw Error('表格请控制在 1 MB 内。');
  if(/\.csv$/i.test(file.name))return {rows:parseCSV(await file.text()),sheet:'CSV'};
  if(!/\.xlsx$/i.test(file.name))throw Error('请选择 .xlsx 或 .csv 文件；旧版 .xls 请先另存为 .xlsx。');
  const table=workbookRows(await unpackWorkbook(new Uint8Array(await file.arrayBuffer())));
  return {rows:tableRowsToEmployees(table.rows),sheet:table.name};
}
