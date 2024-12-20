# uniapp-db-plugin

> uniapp app开发中的操作sqlite数据库的hook插件 📦
Language: English | [中文](README-ZH.md)
## Install

```sh
pnpm add uniapp-db-plugin
```

## Usage ✨

```typescript
import { useSqlite } from '/src/hooks/useSqlite'

	const { insertBatch, select, sqldelete, sqlite, selectPage, insert, update } = useSqlite(
		'test_table',
		{
			data: 'TXEXT',
			userName: 'TEXT',
			createdAt: "not null default(datetime(CURRENT_TIMESTAMP,'localtime'))",
			updatedAt: "not null default(datetime(CURRENT_TIMESTAMP,'localtime'))",
		},
		'test_table_id',
	)

	// 新增数据
	const inserData = () => {
		insert({
			data: '',,
			userName: 'cs1',
		})
	}
	// 更新
	const updateData = () => { 
    const upinfo = "userName='xxx' and test_table_id=2"
		try {
			update(upinfo,
				'test_table_id',
			)
		} catch (error) {
			console.log('error', error)
		}
	}
	// 删除
	const deleteData = () => {
		sqldelete({ test_table_id: 3 })
	}
	// 条件查询
	const selectData = () => {
		select("userName='cs1' and test_table_id>3").then((res) => {
			console.log('条件查询结果', res)
		})
	}

```

也可以使用对象键值对查询（内部已封装）

```js
	const selectData2 = () => {
		const conditions = {
			userName: ['xxx'],
			test_table_id: '<6',
		}

		select(conditions).then((res) => {
			console.log('条件查询结果', res)
		})
	}
  const updateData = () => {
		try {
			update(
				{
					test_table_id: 2,
					userName: 'xxx',
				},
				'test_table_id',
			)
		} catch (error) {
			console.log('error', error)
		}
	}
```

## API 🚀

### 查看type类型文件即可

## Why Use This? 🤔

- **方便**： 使用封装钩子加快开发效率。
- **继承模式**： 易于管理。
- **易于使用**： 简单明了的 API 使用。
- **TypeScript**： 完全支持 TypeScript 类型。

## 如何贡献 💪

欢迎贡献！如果您想改进本工具，请随时打开问题或提交拉取请求。

### How to contribute:
1. 分叉仓库
2. 为您的功能/错误修正创建一个新分支
3. 提交包含更改的拉取请求

## License 📜

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

👨‍💻 Developed by [cherishtao](https://github.com/CherishMvp)

感谢使用 **uniapp-db-plugin**! 😎