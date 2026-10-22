# Nexus 前端设计

当前只提供新的 Apple-inspired 外观，没有原版切换入口。

## 设计取舍

Nexus 是工作工具，借鉴产品官网的清楚标题、克制颜色和留白，以及软件界面的熟悉操作，不把日常任务改造成必须滚动的广告叙事。工作台保持可用的任务密度；登录首屏突出一句核心价值与一个主要操作。

颜色以白、#F5F5F7、#1D1D1F 与 #0071E3 为主。正文和重要业务内容优先保证可读；标题以字号与字重建立层次。字体使用系统优先栈，在 Apple 设备自然采用系统字体，不下载或分发 Apple 字体。

玻璃效果集中于浮动侧栏、薄顶栏、对话框、顶部消息通知和首屏的业务视觉。使用 CSS backdrop-filter 的高斯模糊、saturate、白色细边与轻微内高光；这是网页材料效果，不声称完全复现 Apple 专有的动态折射渲染。表单、聊天文本和任务卡片保持实心阅读面。

小屏重新组织侧栏和聊天联系人；减少动效、减少透明度的系统偏好有对应降级，不支持 backdrop-filter 的浏览器回退到实色面板。

`glass.css` 负责唯一的新外观；`style.css` 与 `messenger.css` 提供已有组件布局基础，不提供旧版入口。业务代码、审批状态机、权限和数据结构不变。

## 验证

检查桌面与移动断点、页面溢出、导航抽屉、聊天输入与发送、顶部消息提示、表单弹窗。沿用业务测试，静态资源检查额外验证新样式文件存在。

## 参考

- [Apple MacBook Air](https://www.apple.com/macbook-air/)：参考产品主导、信息层次与逐步发现的结构。
- [Apple Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)：材料与界面层次的参考入口。本次正文读取受 JavaScript 渲染限制，未引用无法获取的具体规范。

本项目不是 Apple 官方产品或 Apple 官方设计系统的实现。
