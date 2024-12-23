# uniapp-db-plugin

> Manipulating sqlite databases in uniapp app developmentThe hook plugin 📦

> Language: English | [中文](README-ZH.md)
## Install

```sh
pnpm add uniapp-db-plugin
```

## Tip ✨
> Initialization tip: Note that if you use ``useSqlite`` to create an initialized table, the default is an auto-incrementing ID primary key.
> If you need to set other structures in the table as indexes and use the **update or modify method** at the same time: ``INSERT OR REPLACE INTO students (id, name, score) VALUES (1, 'John', 90);``, then you should use ``CREATE UNIQUE INDEX "main"."key" ON "xx" ( "key" );`` to set the unique index

## Usage ✨

### init 🧐
```typescript
import { useSqlite } from 'uniapp-db-plugin'
// This is a hook that includes a sqlite instance and common encapsulated methods
	const { insertBatch, select, sqldelete, sqlite, selectPage, insert, update } = useSqlite(
		'test_table',//table name
		//表结构
		{
			data: 'TXEXT',
			userName: 'TEXT',
			createdAt: "not null default(datetime(CURRENT_TIMESTAMP,'localtime'))",//required
			updatedAt: "not null default(datetime(CURRENT_TIMESTAMP,'localtime'))",//required
		},
		'test_table_id',//primary key auto increment
	)
	// add
	const inserData = () => {
		insert({
			data: '',,
			userName: 'cs1',
		})
	}
	// update
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
	// del
	const deleteData = () => {
		sqldelete({ test_table_id: 3 })
	}
	// select
	const selectData = () => {
		select("userName='cs1' and test_table_id>3").then((res) => {
			console.log('rs', res)
		})
	}

```

Object key-value pair queries can also be used (internally encapsulated)

```js
	const selectData2 = () => {
		const conditions = {
			userName: ['xxx'],
			test_table_id: '<6',
		}

		select(conditions).then((res) => {
			console.log('rs', res)
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

### Just look at the type file

## Why Use This? 🤔

- **Convenience**: Use the encapsulated hooks to speed up development efficiency.
- **Singleton Pattern**: Easy to manage.
- **Ease of Use**: Simple and clear API usage.
- **Full TypeScript Support**: Complete TypeScript type support.

## Contributing 💪

Contributions are welcome! If you'd like to improve this utility, feel free to open issues or submit pull requests.

### How to contribute:
1. Fork the repository
2. Create a new branch for your feature/bugfix
3. Submit a pull request with your changes

## License 📜

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

👨‍💻 Developed by [cherishtao](https://github.com/CherishMvp)

Thanks for using **uniapp-db-plugin**! 😎