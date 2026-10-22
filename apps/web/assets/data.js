export const roles = {
  owner: {label:'企业主', desc:'全局经营、审批与连接管理', name:'Li Wei', staff:'e1'},
  manager: {label:'团队主管', desc:'团队任务、资源与业务审批', name:'Aisha', staff:'e2'},
  hr: {label:'人力资源', desc:'员工资料、休假与考勤', name:'Mei Ling', staff:'e3'},
  finance: {label:'财务人员', desc:'报销审核、付款与财务连接', name:'Kumar', staff:'e4'},
  employee: {label:'普通员工', desc:'自己的任务、考勤和申请', name:'Daniel', staff:'e5'},
  support: {label:'客户服务', desc:'客户收件箱与本人负责的订单', name:'Nur', staff:'e6'}
};
export const connectors = [
  {id:'payments', name:'支付与收款', brand:'RM', desc:'确认交易状态，再更新订单。', provider:'支付服务商 / DuitNow 服务商待确认', endpoint:'/api/v1/connectors/payments/events', scope:'交易编号、金额、状态'},
  {id:'accounting', name:'会计与财务', brand:'∑', desc:'订单、费用与发票保持一致。', provider:'会计软件与 MyInvois 对接待确认', endpoint:'/api/v1/connectors/accounting/invoices', scope:'发票、客户、应收款'},
  {id:'payroll', name:'工资管理', brand:'P', desc:'同步已核准考勤和加班时数。', provider:'Payroll 供应商待确认', endpoint:'/api/v1/connectors/payroll/approved-hours', scope:'员工编号、核准工时'},
  {id:'crm', name:'客户关系 CRM', brand:'C', desc:'客户历史与项目在一处汇合。', provider:'CRM 供应商待确认', endpoint:'/api/v1/connectors/crm/contacts', scope:'客户、负责人、项目'},
  {id:'commerce', name:'电商与订单', brand:'袋', desc:'接收订单变更与库存事件。', provider:'电商供应商待确认', endpoint:'/api/v1/connectors/commerce/orders', scope:'SKU、数量、订单状态'},
  {id:'whatsapp', name:'WhatsApp Business', brand:'W', desc:'客户消息进入站内统一收件箱。', provider:'Meta Business Platform · 待企业授权', endpoint:'/api/v1/webhooks/whatsapp', scope:'已授权企业号码的消息'}
];
export function initialState() {
 return {
  version:1, session:null, state:'Selangor', industry:'印刷与定制礼品',
  staff:[
   {id:'e1',name:'Li Wei',role:'企业主',team:'管理',email:'li@example.test',skill:'经营',capacity:4},
   {id:'e2',name:'Aisha',role:'项目主管',team:'运营',email:'aisha@example.test',skill:'排期',capacity:6},
   {id:'e3',name:'Mei Ling',role:'人力资源',team:'行政',email:'mei@example.test',skill:'人事',capacity:5},
   {id:'e4',name:'Kumar',role:'财务',team:'财务',email:'kumar@example.test',skill:'财务',capacity:6},
   {id:'e5',name:'Daniel',role:'制作专员',team:'运营',email:'daniel@example.test',skill:'印刷',capacity:8},
   {id:'e6',name:'Nur',role:'客服',team:'运营',email:'nur@example.test',skill:'客户服务',capacity:5},
   {id:'e7',name:'Amir',role:'制作专员',team:'运营',email:'amir@example.test',skill:'印刷',capacity:5}
  ],
  stock:80,
  inquiries:[{id:'Q-1042',customer:'Bunga Café',text:'Hi! 我们需要 100 个定制杯，10 月 26 日前交货，可以吗？请先给报价。',qty:100,due:'2026-10-26',status:'new',assignee:'e6',source:'WhatsApp · 合成消息',plan:null}],
  tasks:[{id:'T-201',title:'门店菜单印刷 · 校对',project:'Bunga Café 品牌物料',customer:'Bunga Café',assignee:'e5',due:'2026-10-24',status:'进行中',blocked:'等待客户确认尺寸'},
    {id:'T-202',title:'Deepavali 礼盒 · 设计确认',project:'Kedai Kita 节庆礼盒',customer:'Kedai Kita',assignee:'e7',due:'2026-10-28',status:'待开始',blocked:''}],
  projects:[{id:'p1',name:'Bunga Café 品牌物料',customer:'Bunga Café',progress:65,focus:'本月完成门店开业物料',risk:'客户确认延迟；Daniel 已批准休假'},
    {id:'p2',name:'Kedai Kita 节庆礼盒',customer:'Kedai Kita',progress:40,focus:'完成样品与批量生产排期',risk:'包装材料待确认'}],
  leave:[{id:'L-001',staff:'e5',from:'2026-10-26',to:'2026-10-26',days:1,reason:'个人事务',status:'approved'}],
  claims:[], ot:[], attendance:[], daily:[],
  announcements:[{id:'A1',title:'本周交付安排',text:'加急订单请先检查库存和人员可用性，由主管确认后再承诺交期。',by:'Aisha'}],
  chats:[{id:'M1',room:'交付协作',by:'Aisha',staff:'e2',text:'Bunga Café 的订单需要先确认杯子库存。请不要直接向客户承诺交期。',time:'09:15'},
    {id:'M2',room:'交付协作',by:'Daniel',staff:'e5',text:'我 26 日休假已经批准，Amir 可以接手制作。',time:'09:18'}],
  logs:[{id:'EV-001',time:'2026-10-23T01:20:00.000Z',type:'request',title:'收到客户询价 Q-1042',detail:'Bunga Café · 100 个定制杯 · 合成数据',actor:'演示导入',staff:'e6',visibility:'operations'},
    {id:'EV-002',time:'2026-10-23T01:10:00.000Z',type:'approval',title:'休假已批准',detail:'Daniel · 2026-10-26 · 已反映到资源排期',actor:'Aisha',staff:'e5',visibility:'hr'}],
  connections:{}, replies:[]
 };
}
