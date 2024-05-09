<div align="center">
  
# Sekai.explode

一种基于 **discord.js V14** 的多功能机器人。

![Alt](https://repobeats.axiom.co/api/embed/b7fc33791d3233660e7c02524ace22c31b66e890.svg "Repobeats analytics image")

</div>

## 这是什么？
一种基于 [```discord.js V14```](https://discord.js.org/) 开发的多功能Discord机器人。

项目的初衷是方便初学者使用，易于添加和删除功能。

## 快速开始
本项目作为一个公共机器人全天候运行，点击[此处](https://discord.com/api/oauth2/authorize?client_id=1144600133762293800&permissions=8&scope=bot)以快速添加到你的服务器。

## 本地部署
### 环境要求
- 已安装 [```Node.js```](https://nodejs.org/en) （推荐使用 v18 或更高版本）
- 已安装 [```Npm```](https://www.npmjs.com/) 或 [```Yarn```](https://yarnpkg.com/)
- 已安装 [```Git```](https://git-scm.com/)
- **可选)** 已安装 [```pm2```](https://pm2.io/)
> ⚠ 如果 PM2 不可用，```/update``` 命令将无法运行。

### 开始部署

> ⚠ 开始部署前请先检查环境要求。

1. 运行 `git clone` 克隆此版本库。
2. 运行 `npm install` 安装依赖项。
3. 复制 `config.json.example` 并重命名为 `config.json`。
4. 编辑 `config.json`。
5. 使用 `npm start` 或 `pm2 start npm -- start` 启动。
6. 大功告成！


### 注册命令

#### 向```misc```软件包添加
只需要在```packages/misc/commands```目录下创建你的文件，启动时会自动加载。

**例:**
```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Hello World!'),
    execute: async function (interaction) {
        await interaction.reply('Hello World!') //処理を記述
    }
};
```

### 添加软件包
在 `packages` 目录下创建一个工作区，软件包会自动加载。
```sh
npm init -w packages/example
```

在入口点文件（如 ```index.js```）中添加命令并导出功能。

**例:**
```js
const { CommandManager } = require('../../internal/commands');
const upload = require('./upload');

class ExampleFeature {
	onLoad() {
		CommandManager.default.addCommands({
            data: new SlashCommandBuilder()
                .setName('hello')
                .setDescription('Hello World!'),
            execute: async function (interaction) {
                await interaction.reply('Hello World!') //処理を記述
            }
        });
	}
}

module.exports = { feature: new ExampleFeature() };
```
