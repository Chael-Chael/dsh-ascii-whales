# ASCII 鲸鱼 · DeepSeek Harness

让鲸群游过留白，让思绪慢慢浮出水面。

新对话展开时，蓝色鲸群从字符之间游来。细小的鱼群随水流散开，尾迹缓缓隐去；输入框像一片磨砂玻璃，轻轻托住尚未写下的话。

[English](README.en.md) · [npm](https://www.npmjs.com/package/dsh-ascii-whales) · [Releases](https://github.com/Chael-Chael/dsh-ascii-whales/releases)

![浅色模式：鲸群游过聊天背景](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/light.gif)

## 安装

在 DeepSeek Harness 的插件管理中添加 npm 包 **`dsh-ascii-whales`**，完成后重启相应实例。

Web CLI 用户也可使用：

```powershell
dsh plugin --profile web add dsh-ascii-whales
```

将 `web` 换成目标 Web profile。Desktop 请通过客户端插件管理安装。

插件默认启用，配置入口为 **设置 → ASCII 鲸鱼**。

## 一片海，两种光

动画铺在整个空白聊天主区域，位于标题与输入框后方。它保留原项目的 ASCII 字符色块、身体弯曲、鱼群游动与扩散尾迹；鲸鱼以不同大小游过，默认主色为 DeepSeek 蓝 `#4d6bfe`。

浅色像日光下的水面，深色像夜里的海。毛玻璃使用中性白／深灰透明层，没有额外的蓝色 tint；经过后方的鲸鱼会自然透出模糊的颜色。开始已有对话后，装饰自动退场。

选中的颜色落在鲸鱼身体的中间调，暗面压深、亮面提亮，保留逐格光照层次与身体立体感。两种主题沿用同一套鱼身配色，让你的那一抹蓝，在日夜之间都留得住。

![深色模式](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/dark.gif)

## 调一调你的海

新增 **字符风格 → Kanji**：改编自 MIT 许可的 [ascii-kanji-sharks](https://github.com/michikusa404/ascii-kanji-sharks)，使用鲸鱼形态，使用 stackedlol/ascii-sharks 的游动与鱼群模拟，保留 Kanji 上游按笔画密度生成的明暗与捕食文字效果。沿用数量、大小、速度、颜色、网格、尾迹和字体设置；字符栅格最低为 4 px（达到下限后不再缩小）。Kanji（日文汉字）使用“中文字体名称”；英文字体设置仅作用于 ASCII。字体离线内置，原有 ASCII／汉字鲸鱼仍可选。

使用 DSH 官方的设置页、按钮、输入框与开关。颜色区提供可视化色块及系统选色器，选色后即时生效。

也可以让汉字入海：**设置 → ASCII 鲸鱼 → 字符风格 → 汉字**。吻部落“吻”，眼睛落“目”，背部落“背”，胸鳍与背鳍落“鳍”，尾鳍落“尾”；其余鲸身由水、海、潮、鲸等字铺开，小鱼化作鱼字旁的游字。字随身体弯曲转向。三种样式按近似相同的字符格面积校准颗粒感：ASCII 保留窄格，汉字与 Kanji 使用方格，并随画布宽度一起调整；仍可用“字符栅格”调节。

英文默认内置 **Geist Mono 600**，与原项目演示一致；汉字默认内置 **思源宋体**。两套字体用于动画，随插件离线加载。切换“字体 → 本机自定义”，可分别填写已安装的中英文字体名称，例如 `Consolas`、`方正屏显雅宋简体`。

点击 **扫描本机字体**，允许浏览器访问字体后，即可从下拉菜单中选择，也可直接输入字体名称。

![Kanji · 浅色](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/kanji-light.gif)
![Kanji · 深色](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/kanji-dark.gif)

![座头鲸与虎鲸切换](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/species.gif)

![汉字 · 浅色](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-light.gif)
![汉字 · 深色](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/hanzi-dark.gif)

| 设置 | 默认 | 范围 / 作用 |
| --- | --- | --- |
| 显示海洋 | 开 | 控制整个背景与配套玻璃 |
| 鲸鱼种类 | 座头鲸 | 座头鲸 / 虎鲸；三种字符风格均可切换并保存 |
| 字符风格 | ASCII | ASCII / 汉字 / Kanji；即时切换并保存 |
| 字体 | 内置默认 | 内置默认 / 本机自定义；中英文字体名称分别保存 |
| 眼睛底色 | 跟随主色 | 控制眼睛位置的背景方块；默认沿用身体底色，可选黑色／白色，字符自动使用对比色。Kanji 默认透明，选黑／白后增加眼睛底色块 |
| 彩色闪烁 | 关 | ASCII / 汉字：关闭使用主色深浅，开启恢复原版七色字符点缀；不改变身体主色。Kanji 使用自身闪光效果，此开关不适用 |
| 海洋颜色 | DeepSeek 蓝 | 可视化选色器；同步鱼群、尾迹配色 |
| 鲸鱼数量 | 3 | 1–20 |
| 鲸鱼大小 | 1.2 倍 | 0.1–10 倍，保留个体大小差异 |
| 游动速度 | 0.65 倍 | 0.1–10 倍 |
| 动画透明度 | 1 | 0–1；1 为完全不透明 |
| 字符栅格 | 0.8 倍 | 0.1–10 倍；越大越有颗粒感 |
| 底纹网格透明度 | 0.05 | 0–1；0 隐藏底纹 |
| 小鱼数量 | 170 | 0–1000；0 隐藏小鱼 |
| 尾迹强度 | 1 | 0–10；0 隐藏扩散尾迹 |
| 毛玻璃输入框 | 开 | 独立开关 |
| 玻璃模糊 | 14 px | 0–64 px |
| 玻璃不透明度 | 0.45 | 0–1；越高越不透 |

大小、栅格、速度、尾迹在 1 以下以 **0.05** 为步长，从 1 起以 **0.1** 为步长；跨界为 `0.95 ↔ 1 ↔ 1.1`，也可直接输入数值。

座头鲸保留长胸鳍和宽尾叶；虎鲸采用更宽的圆钝头部、短圆胸鳍，以及独立于眼睛底色的白色眼斑与侧腹斑。两种鲸鱼都保留自选主色，虎鲸白斑固定为浅白色。

三种样式均接入鲸鱼种类、显示开关、数量、大小、速度、透明度、字符栅格、网格透明度、小鱼数量、尾迹强度、颜色、字体及毛玻璃的开关／模糊／不透明度。颜色作用于身体、小鱼和尾迹；眼睛背景方块默认沿用身体底色，可单独选择黑色或白色；Kanji 的闪光与拟声文字保留主题强调色。

默认三条鲸鱼的相对大小为 100%、70%、84%。ASCII 小鱼以短横字符呈现，汉字模式使用鱼、鲤、鲭、鲱，尺寸随字符栅格一起变化。

**恢复默认** 使用 DSH 官方主按钮，随深浅主题切换，可一键回到最初的蓝色海面。偏好保存在当前浏览器。动画遵循系统“减少动态效果”设置，并在后台标签页暂停。

![可视化颜色与官方设置控件](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings.gif)

![内置字体与本机字体下拉选择](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/fonts.gif)

<details>
<summary>查看设置截图</summary>

![浅色设置](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings-light.png)
![深色设置](https://raw.githubusercontent.com/Chael-Chael/dsh-ascii-whales/main/docs/media/settings-dark.png)

</details>

## 从哪里游来

基于 [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks) 的源码改造。原作者完成了鱼群模拟、柔性身体、字符栅格与光影渲染；本项目在其基础上加入鲸鱼形态、DSH 集成、主题适配与可调参数。

**Kanji**样式改编自 [michikusa404](https://github.com/michikusa404) 创作的 **[ascii-kanji-sharks · 漢字の海](https://github.com/michikusa404/ascii-kanji-sharks)**（MIT License，Copyright © 2026 michikusa404）。汉字笔画密度明暗与文字特效源于该项目；本项目将形态改为鲸鱼，并负责 DSH 接入、透明背景、可调参数与离线字体适配。完整许可保留在 [vendor/ascii-kanji-sharks/LICENSE](vendor/ascii-kanji-sharks/LICENSE)。

感谢 **michikusa404** 将汉字化作海洋，也感谢 **stackedlol** 创作的字符鱼群与动画实现。感谢两位原作者公开源码，让这片海能够游进 DeepSeek Harness。

固定的上游版本、改动范围与署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。毛玻璃实现参考了 [dsh-glass-theme](https://github.com/cnayu/dsh-glass-theme) 与 [dsh-skin-glass](https://github.com/noexcs/dsh-skin-glass) 的相关思路。

## 开发与验证

```sh
npm ci --legacy-peer-deps
npm run check
npm pack
```

动画与字体随插件一起打包，可离线加载。

测试与 GIF 录制见 [开发文档](docs/development.md)，测试结果见 [验证记录](docs/validation.md)。

Kanji 的游动、追逐、转向和身体摆动与 ASCII／汉字共用 stackedlol/ascii-sharks 运动模拟；保留鲸鱼轮廓，采用 Kanji 字符明暗和文字特效。
