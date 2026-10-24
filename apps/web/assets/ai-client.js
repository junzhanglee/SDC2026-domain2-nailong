export function createAIUI({getState,esc,modal,toast,requirePermission,staffId,compose,saveDraft}){
  let active=null,busy=false;
  const allowed=()=>{const s=getState();requirePermission(s,'customer-support');return staffId(s);};
  function open(message,context){
    const actor=allowed();if(!message?.trim())throw Error('没有可分析的客户消息。');
    active={message,context,actor,result:null};busy=false;
    modal('AI · 客户需求与回复草稿',`<p class="notice">点击生成后，仅将下方消息发送至 OpenAI。请先移除敏感资料；AI 不读取员工资料或其他对话。结果需人工核对，不会发送消息、建单或审批。</p><label for="ai-source">本次分析的客户消息</label><textarea id="ai-source" maxlength="2000">${esc(message)}</textarea><div class="actions spaced"><button class="btn" type="button" data-action="ai-generate">生成需求与回复草稿</button></div><div id="ai-result" aria-live="polite"></div>`);
  }
  async function generate(){
    if(!active||busy)return;if(allowed()!==active.actor)throw Error('身份已改变，请重新打开客户消息。');
    const source=document.querySelector('#ai-source'),resultBox=document.querySelector('#ai-result'),button=document.querySelector('[data-action="ai-generate"]');
    if(!source||!resultBox||!button)return;
    const message=source.value.trim();if(!message||message.length>2000)throw Error('请输入 1–2000 字的消息。');
    const job=active;job.result=null;busy=true;button.disabled=true;source.readOnly=true;button.textContent='正在生成…';resultBox.textContent='正在提取，请稍候。';
    try{
      const response=await fetch('/api/ai/customer-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message}),signal:AbortSignal.timeout(30000)});
      const data=await response.json();
      if(active!==job||!resultBox.isConnected||allowed()!==job.actor)return;
      if(!response.ok){resultBox.innerHTML=`<div class="notice">${esc(data.error||'AI 服务暂不可用。')}${data.code==='sign_in_required'?'<p><a href="/signin-with-chatgpt?returnTo=%2F" target="_top">使用 ChatGPT 登录后继续 ↗</a></p>':''}</div>`;return;}
      const r=data.result;job.result=r;job.message=message;
      resultBox.innerHTML=`<div class="notice spaced">OpenAI · ${esc(data.model)} · 生成结果待人工确认</div><h3>需求摘要</h3><p>${esc(r.summary)}</p><p>产品：${esc(r.product||'未提供')}<br>数量：${esc(r.quantity??'未提供')}<br>期望日期：${esc(r.requested_date||'未提供')}</p><p class="footer-note">原文依据：${['product','quantity','requested_date'].filter(k=>r.evidence[k]).map(k=>esc(r.evidence[k])).join(' / ')||'无明确字段依据'}</p>${r.missing_fields.length?`<div class="notice">需要补充：${r.missing_fields.map(esc).join('、')}</div>`:''}<div class="field"><label for="ai-draft">可编辑回复草稿</label><textarea id="ai-draft" maxlength="2000">${esc(r.reply_draft)}</textarea></div><div class="actions"><button class="btn" data-action="ai-use-draft" type="button">${job.context.inquiryId?'保存回复草稿（不发送）':'填入回复框（不发送）'}</button>${job.context.customerId?'<button class="btn secondary" data-action="ai-use-fields" type="button">核对并建立请求</button>':''}</div>`;
    }catch{if(resultBox.isConnected&&active===job)resultBox.textContent='AI 暂时无法完成请求。原始消息仍在，请重试或人工处理。';}
    finally{if(active===job){busy=false;if(button.isConnected){button.disabled=false;button.textContent='重新生成';source.readOnly=false;}}}
  }
  function checked(){if(document.querySelector('#ai-source')?.value.trim()!==active?.message)throw Error('消息已改动，请重新生成后再采用。');if(!active?.result)throw Error('请先生成草稿。');if(allowed()!==active.actor)throw Error('身份已改变，请重新打开客户消息。');return active;}
  function useDraft(){const job=checked(),text=document.querySelector('#ai-draft')?.value.trim();if(!text||text.length>2000)throw Error('回复草稿须为 1–2000 字。');saveDraft(job.context,text);toast('草稿已保留，尚未发送。');}
  function useFields(){const job=checked();document.querySelector('#modal').close();compose(job.context.customerId,job.context.messageId,{text:job.message,qty:job.result.quantity,due:job.result.requested_date});}
  return {open,generate,useDraft,useFields};
}
