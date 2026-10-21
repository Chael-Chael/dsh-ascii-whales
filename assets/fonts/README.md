# Bundled animation fonts

The client embeds these WOFF subsets as data URLs, without a CDN or runtime font download. They cover the animation's fixed character sets, not arbitrary chat text. Chat and settings typography remains controlled by DSH.

| Subset family | Original | Source revision | Weight | Coverage | License |
| --- | --- | --- | --- | --- | --- |
| Whales Mono | Geist Mono SemiBold | [742b082](https://github.com/vercel/geist-font/tree/742b08235ce818c6c464c1323087ea38a1241ff1) | 600 | ASCII U+0020–007E and U+00B7 | [OFL-Geist.txt](OFL-Geist.txt) |
| Whales Hanzi | Source Han Serif SC Regular | [7889f11](https://github.com/adobe-fonts/source-han-serif/tree/7889f11bf31170b5d092a083b357c8c8130f89e0) | 400 | 水川汐沙浪海潮鲸深度求索鳍丿丨丶一目鱼鲤鲭鲱吻背尾, space, * and · | [OFL-SourceHanSerif.txt](OFL-SourceHanSerif.txt) |

Modified with fontTools: retained the listed characters, converted OTF to WOFF, and renamed name/CFF family and PostScript names to Whales Mono / Whales Hanzi. Copyright and OFL notices are retained. These subsets remain under SIL OFL 1.1, separately from the plugin's integration license. Adding animation characters requires updating subset coverage.

Geist Mono 600 matches the typeface and weight declared by the upstream ascii-sharks demo. Source Han Serif provides a redistributable Chinese serif. Founder PingXianYaSong is not bundled; users can select their locally installed copy through the custom font setting.
