# ASCII 鲸鱼 · DeepSeek Harness

让鲸群游过留白，让思绪慢慢浮出水面。

新对话展开时，蓝色鲸群从字符之间游来。细小的鱼群随水流散开，尾迹缓缓隐去；输入框像一片磨砂玻璃，轻轻托住尚未写下的话。

[English](README.en.md) · [npm](https://www.npmjs.com/package/dsh-ascii-whales) · [Releases](https://github.com/Chael-Chael/dsh-ascii-whales/releases)

![浅色模式：鲸群游过聊天背景](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/light.gif)

## 安装

当前 `main` 为 **0.1.1 开发版**，包含汉字、内置字体与本机选字功能；npm 暂保留 **0.1.0**，尚未发布本轮更新。

在 DeepSeek Harness 的插件管理中添加 npm 包 **`dsh-ascii-whales`**，完成后重启相应实例。

Web CLI 用户也可使用：

```powershell
dsh plugin --profile web add dsh-ascii-whales
```

将 `web` 换成目标 Web profile。Desktop 请通过客户端插件管理安装。

已验证宿主：**DSH 0.2.1-rc.2、Windows / Microsoft Edge Web**。插件默认启用，配置入口为 **设置 → ASCII 鲸鱼**。

## 一片海，两种光

动画铺在整个空白聊天主区域，位于标题与输入框后方。它保留原项目的 ASCII 字符色块、身体弯曲、鱼群游动与扩散尾迹；鲸鱼以不同大小游过，默认主色为 DeepSeek 蓝 `#4d6bfe`。

浅色像日光下的水面，深色像夜里的海。毛玻璃使用中性白／深灰透明层，没有额外的蓝色 tint；经过后方的鲸鱼会自然透出模糊的颜色。开始已有对话后，装饰自动退场。

选中的颜色落在鲸鱼身体的中间调，阴影稍深，高光稍亮。两种主题沿用同一套鱼身配色，让你的那一抹蓝，在日夜之间都留得住。

![深色模式](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/dark.gif)

## 调一调你的海

使用 DSH 官方的设置页、按钮、输入框与开关。颜色区提供可视化色块及系统选色器，选色后即时生效。

也可以让汉字入海：**设置 → ASCII 鲸鱼 → 字符风格 → 汉字**。吻部落“吻”，眼睛落“目”，背部落“背”，胸鳍与背鳍落“鳍”，尾鳍落“尾”；其余鲸身由水、海、潮、鲸等字铺开，小鱼化作鱼字旁的游字。字随身体弯曲转向，汉字栅格更宽，也能用“字符栅格”继续调节。

英文默认内置 **Geist Mono 600**，与原项目演示一致；汉字默认内置 **思源宋体**。两套字体只用于动画，随插件离线加载。切换“字体 → 本机自定义”，可分别填写已安装的中英文字体名称，例如 `Consolas`、`方正屏显雅宋简体`；留空或字体不可用时回退到内置字体。本机字体文件不会被上传或打包。

点击 **扫描本机字体** 后，可从官方下拉菜单中选择；首次扫描需允许浏览器访问字体。暂不支持扫描的浏览器仍可手动填写。

![汉字 · 浅色](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-light.gif)
![汉字 · 深色](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-dark.gif)

| 设置 | 默认 | 范围 / 作用 |
| --- | --- | --- |
| 显示鲸鱼 | 开 | 控制整个背景与配套玻璃 |
| 字符风格 | ASCII | ASCII / 汉字；即时切换并保存 |
| 字体 | 内置默认 | 内置默认 / 本机自定义；中英文字体名称分别保存 |
| 鲸鱼颜色 | DeepSeek 蓝 | 可视化选色器；同步鱼群、尾迹配色 |
| 鲸鱼数量 | 3 | 1–20 |
| 鲸鱼大小 | 1 倍 | 0.1–10 倍，保留个体大小差异 |
| 游动速度 | 1 倍 | 0.1–10 倍 |
| 动画透明度 | 1 | 0–1；1 为完全不透明 |
| 字符栅格 | 1 倍 | 0.1–10 倍；越大越有颗粒感 |
| 底纹网格透明度 | 0.05 | 0–1；0 隐藏底纹 |
| 小鱼数量 | 170 | 0–1000；0 隐藏小鱼 |
| 尾迹强度 | 1 | 0–10；0 隐藏扩散尾迹 |
| 毛玻璃输入框 | 开 | 独立开关 |
| 玻璃模糊 | 14 px | 0–64 px |
| 玻璃不透明度 | 0.45 | 0–1；越高越不透 |

大小、栅格、速度、尾迹在 1 以下以 **0.05** 为步长，从 1 起以 **0.1** 为步长；跨界为 `0.95 ↔ 1 ↔ 1.1`，也可直接输入数值。

默认三条鲸鱼的相对大小为 100%、70%、84%。ASCII 小鱼以短横字符呈现，汉字模式使用鱼、鲤、鲭、鲱，尺寸随字符栅格一起变化。

**恢复默认** 使用 DSH 官方主按钮，随深浅主题切换，可一键回到最初的蓝色海面。偏好保存在当前浏览器，不会跨浏览器或不同 Web 地址同步。遵循系统“减少动态效果”设置，后台标签页暂停动画。很细的栅格配合大量鲸鱼或高倍速度会增加渲染开销。

从 0.1.0 升级会保留已有的透明度偏好；想使用新的完整主色效果，可将动画透明度设为 **1**，或点击 **恢复默认**。

![可视化颜色与官方设置控件](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings.gif)

![内置字体与本机字体下拉选择](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/fonts.gif)

<details>
<summary>查看设置截图</summary>

![浅色设置](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings-light.png)
![深色设置](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings-dark.png)

</details>

## 从哪里游来

直接使用并改造 [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks) 的源码，**不是重新仿写一套动画**。原作者完成了鱼群模拟、柔性身体、字符栅格与光影渲染；本项目在其基础上加入鲸鱼形态、DSH 集成、主题适配与可调参数。

固定的上游版本、改动范围与署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。毛玻璃实现参考了 [dsh-glass-theme](https://github.com/cnayu/dsh-glass-theme) 与 [dsh-skin-glass](https://github.com/noexcs/dsh-skin-glass) 的相关思路。

## 开发与验证

```sh
npm ci --legacy-peer-deps
npm run check
npm pack
```

构建产物自带动画代码，不会在运行时访问上游仓库或 CDN。插件本身不读取、发送聊天内容，也不调用模型。

测试与 GIF 录制见 [docs/development.md](docs/development.md)，当前验收边界见 [docs/validation.md](docs/validation.md)。DSH 暂无公开背景插槽，插件使用局部 DOM 适配；宿主升级后可能需要跟进。其他改写输入框的主题可能产生样式冲突，可先关闭本插件的毛玻璃选项。
