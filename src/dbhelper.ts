import { isString, isObject, isNumber, map, pick, isArray } from 'lodash-es'

// 参考链接https://www.html5plus.org/doc/zh_cn/sqlite.html
/**
 * 生成 SQL 查询条件字符串
 * @param {object} conditions - 查询条件对象，其中键为字段名，值为对应的条件值
 * @param {Boolean} isFuzzy - 是否进行模糊查询，默认为 false
 * @returns {string} - 返回生成的 SQL 查询条件字符串
 */
const getConditionsSql = (conditions: Record<string, any>, isFuzzy: boolean = false): string => {
	return Object.entries(conditions)
		.map(([key, value]) => {
			if (typeof value === 'string') {
				// 检查是否包含操作符（如 <, >, <=, >=, !=, = 等）
				const match = value.match(/^([<>=!]+)\s*(.+)$/)
				if (match) {
					const [, operator, val] = match
					return `${key} ${operator} '${val.replace(/'/g, "''")}'`
				}
				// 如果没有操作符，按 isFuzzy 判断是否模糊查询
				return `${key} ${isFuzzy ? 'LIKE' : '='} '${isFuzzy ? '%' : ''}${value.replace(/'/g, "''")}${isFuzzy ? '%' : ''}'`
			} else if (typeof value === 'number') {
				return `${key} ${isFuzzy ? 'LIKE' : '='} ${value}`
			} else if (value === null) {
				// 支持 null 值
				return `${key} IS NULL`
			} else if (value === undefined) {
				// 忽略 undefined 条件
				return ''
			} else if (Array.isArray(value)) {
				// 支持 IN 操作
				const inValues = value.map((v) => (typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v)).join(', ')
				return `${key} IN (${inValues})`
			} else {
				// 其他情况统一处理为字符串
				return `${key} ${isFuzzy ? 'LIKE' : '='} '${value}'`
			}
		})
		.filter(Boolean) // 过滤掉 undefined 或空字符串
		.join(' AND ')
}

export class Sqlite {
	private dbName: string
	private dbPath: string
	private sqlite: PlusSqlite = plus.sqlite

	/**
	 * @param dbName "h5db" 数据库名称
	 * @param dbPath "_doc/h5.db" 数据库路径
	 */
	constructor(dbName: string, dbPath: string) {
		this.dbName = dbName
		this.dbPath = dbPath
	}

	/** @function isOpen
	 * 检查数据库是否已打开
	 * @returns {boolean} 返回数据库是否已打开的布尔值
	 */
	isOpen(): boolean {
		return this.sqlite.isOpenDatabase({ name: this.dbName, path: this.dbPath })
	}

	/** @function openSqlite
	 * 打开数据库
	 * @returns {Promise<void|Error>}  成功无返回值 ，失败时返回错误
	 */
	async openSqlite(): Promise<void | Error> {
		try {
			if (this.isOpen()) return
			return await new Promise<void>((resolve, reject) => {
				this.sqlite.openDatabase({
					name: this.dbName,
					path: this.dbPath,
					success: () => resolve(), // 只需要 resolve()，不需要参数
					fail: (error) => reject(error),
				})
			})
		} catch (error)
		{
			// @ts-ignore 
			return error
		}
	}

	/** @function closeSqlite
	 * 关闭数据库
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	async closeSqlite(): Promise<void | Error> {
		try {
			if (!this.isOpen()) return
			return await new Promise<void>((resolve, reject) => {
				this.sqlite.closeDatabase({
					name: this.dbName,
					success: () => resolve(), // 只需要 resolve()，不需要参数
					fail: (error) => reject(error),
				})
			})
		} catch (error) {
			// @ts-ignore 
			return error
		}
	}

	/** @function  executeSql
	 * 执行 SQL 语句
	 * @param {string| Array<string>} sql 要执行的 SQL 语句
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	async executeSql(sql: string | Array<string>, dbName = this.dbName): Promise<void | Error> {
		try {
			return await new Promise<void>((resolve, reject) => {
				this.sqlite.executeSql({
					name: dbName,
					sql: isArray(sql) ? sql : [sql],
					success: () => resolve(),
					fail: (error) => reject(error),
				})
			})
		} catch (error) {
			// @ts-ignore 
			return error
		}
	}

	/** @function selectSql
	 * 执行 SELECT SQL 语句
	 * @param {string} sql 要执行的 SELECT SQL 语句
	 * @returns {Promise<any>} 返回查询结果，失败时抛出错误
	 */
	async selectSql(sql: string): Promise<any> {
		try {
			return await new Promise<any>((resolve, reject) => {
				this.sqlite.selectSql({
					name: this.dbName,
					sql: sql,
					success: (result) => resolve(result),
					fail: (error) => {
						console.error('Error selecting SQL:', error)
						reject()
					},
				})
			})
		} catch (error) {
			// @ts-ignore 
			console.error('Error selecting SQL:', error)
			throw error
		}
	}

	/** @function checkTableExists
	 * 查询有没有这个表格
	 * @param {string} tableName 表名
	 * @returns {Promise<Array<string> | void>} 成功返回数据 没有查询就是空
	 */
	async checkTableExists(tableName: string): Promise<Array<string> | void> {
		const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`
		return await this.selectSql(sql)
	}

	/** @function selectAllTable
	 * 查询所有表
	 * @returns {boolean} 返回查询的所有表数据
	 */
	async selectAllTable(): Promise<boolean> {
		return await this.selectSql('SELECT * FROM sqlite_master')
	}

	/** @function selectPragma
	 * 查询表 字段
	 * @param {string} tableName 表名
	 * @returns {any} 返回查询的所有表数据
	 */

	async selectPragma(tableName: string): Promise<any[]> {
		return await this.selectSql('PRAGMA table_info(' + tableName + ')')
	}

	/** @function createTable
	 * 创建数据表
	 * @param {string} tableName 表名
	 * @param {Record<string, string>} schema 表结构定义
	 * @param key 主键
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	async createTable(tableName: string, schema: Record<string, string>, key?: string): Promise<void | Error> {
		const columns = Object.entries(schema)
			.map(([key, value]) => `${key} ${value}`)
			.join(',')
		const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${key ? `"${key}" INTEGER PRIMARY KEY AUTOINCREMENT, ` : ''}${columns})`
		await this.executeSql(sql)
		return await this.createTrigger(tableName)
	}
	// 创建触发器，自动更新更新时间
	private async createTrigger(tableName: string): Promise<void | Error> {
		const sql = `CREATE TRIGGER IF NOT EXISTS update_${tableName} AFTER UPDATE ON ${tableName} FOR EACH ROW BEGIN UPDATE ${tableName} SET updatedAt = datetime(CURRENT_TIMESTAMP,'localtime') WHERE rowid = OLD.rowid; END`
		return await this.executeSql(sql)
	}
	/**
	 * 根据数据类型创建数据表
	 * @param {string} tableName 表名
	 * @param {Record<string, any>} data 数据对象，用于定义表结构
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	async createTableWithTypes(tableName: string, data: Record<string, any>, key?: string): Promise<void | Error> {
		const columns = Object.entries(data)
			.map(([key, value]) => {
				let typeName = ''
				switch (typeof value) {
					case 'number':
						typeName = Number.isInteger(value) ? 'INTEGER' : 'REAL'
						break
					case 'string':
						typeName = 'TEXT'
						break
					case 'boolean':
						typeName = 'BOOLEAN'
						break
					case 'object':
						if (value instanceof Date) typeName = 'TEXT'
						break
					default:
						typeName = 'TEXT'
						break
				}
				return `${key} ${typeName}`
			})
			.join(',')
		const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${key ? `"${key}" INTEGER PRIMARY KEY AUTOINCREMENT, ` : ''}${columns})`
		console.log(sql, 'sqlte')
		return await this.executeSql(sql)
	}

	/**
	 * 插入数据
	 * @param {string} tableName 表名
	 * @param {Record<string, any>} data 要插入的数据对象 或sql 语句
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	async insert(tableName: string, data: Record<string, any> | string): Promise<void | Error> {
		let sql = `INSERT INTO ${tableName} `
		if (isString(data)) sql += data
		else {
			const columns = Object.keys(data).join(',')
			const values = Object.values(data)
				.map((value) => {
					if (value === null || value === undefined) return 'NULL'
					if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
					if (value instanceof Date) return `'${value.toISOString()}'`
					return value
				})
				.join(',')
			sql += `(${columns}) VALUES (${values})`
		}
		return await this.executeSql(sql)
	}

	/**
	 * 查询数据
	 * @param {string} tableName 表名
	 * @param {Partial<Record<string, any>>} [conditions] 可选的查询条件 或直接sql语句
	 * @param {boolean} isFuzzy - 是否进行模糊查询，默认为 false
	 * @returns {Promise<any>} 返回查询结果
	 */
	async select(tableName: string, conditions?: Partial<Record<string, any>> | string, isFuzzy: boolean = false): Promise<any> {
		let sql = `SELECT * FROM ${tableName}`

		if (conditions) {
			if (isString(conditions)) sql += ` WHERE ${conditions}`
			else {
				const conditionStrings = getConditionsSql(conditions as Partial<Record<string, any>>, isFuzzy)
				sql += ` WHERE ${conditionStrings}`
			}
		}
		return await this.selectSql(sql)
	}

	/**
	 * 分页查询数据
	 *
	 * @param {string} tableName - 要查询的表名
	 * @param {number|string} pageNumber - 当前页码（可以是数字或字符串）
	 * @param {number|string} pageSize - 每页的记录条数（可以是数字或字符串）
	 * @param { Partial<Record<string, any>> } conditions 查询条件
	 * @param {boolean} isFuzzy - 是否进行模糊查询，默认为 false
	 * @param {string} [orderBy] - 可选的排序字段（如 "column_name ASC" 或 "column_name DESC"）
	 * @param {Boolean} desc 是否需要降序

	 * @returns {Promise<any>} 返回查询结果的数据
	 */
	async selectPage(
		tableName: string,
		pageNumber: number | string,
		pageSize: number | string,
		conditions?: Partial<Record<string, any>>,
		isFuzzy?: boolean,
		orderBy?: string,
		desc?: Boolean,
	): Promise<any> {
		let where = ''
		if (conditions && isObject(conditions) && Object.keys(conditions).length !== 0) {
			const conditionStrings = getConditionsSql(conditions, isFuzzy)
			where = ` WHERE ${conditionStrings}`
		}
		const offset = (Number(pageNumber) - 1) * Number(pageSize)
		let sql = `SELECT * FROM ${tableName}${where}${orderBy ? ` ORDER BY ${orderBy} ${desc ? 'desc' : ''}` : ''} LIMIT ${pageSize} OFFSET ${offset}`
		return await this.selectSql(sql)
	}

	/**
	 * 更新指定表中的数据
	 * @param {string} tableName - 表名
	 * @param {Record<string, any>} data - 包含更新字段及其新值的对象，必须包含 id 字段作为条件
	 * @param {string|Record<string, string>} {id:'1'} - 作为唯一标识的字段名，可以是字符串或字符串数组，默认值为 'id'
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	async update(tableName: string, data: Record<string, any>, fieldKey: string | Record<string, string> = 'id'): Promise<void | Error> {
		/* 	if (typeof fieldKey == 'string') {
			delete data[fieldKey];
		} */
		console.log('updates', data)
		const updates = Object.entries(data)
			.map(([key, value]) => {
				if (isString(value)) return `${key} = '${value}'`
				else if (isNumber(value)) return `${key} = ${value}`
				return `${key} = ${value}`
			})
			.join(',')
		// 构建 WHERE 子句
		let whereClause: string
		if (isString(fieldKey)) {
			// 如果 fieldKey 是字符串
			const value = data[fieldKey as string]
			whereClause = isNumber(value) ? `${fieldKey} = ${value}` : `${fieldKey} = '${value}'`
		} else {
			// 如果 fieldKey 是对象
			whereClause = Object.entries(fieldKey)
				.map(([key, value]) => {
					const val = value
					return isNumber(val) ? `${key} = ${val}` : `${key} = '${val}'`
				})
				.join(' AND ')
		}
		const sql = `UPDATE ${tableName} SET ${updates} WHERE ${whereClause}`
		console.log('sql', sql)
		return await this.executeSql(sql)
	}

	/** @function  dealUpdateBatch
	 * 批量更新记录，如果记录不存在则插入新记录
	 * @param {string} tbName - 表名
	 * @param {any[]} fieldList - 需要更新或插入的记录列表，每条记录是一个对象，包含待操作的数据
	 * @param {string| Record<string, string> } [fieldKey='id'] - 作为唯一标识的字段名，默认值为 'id'
	 * @returns {Promise<{ success: any[]; error: any[] }>} - 返回一个对象，其中：
	 *   - `success` 是一个数组，包含成功更新或插入的记录的结果
	 *   - `error` 是一个数组，包含在处理过程中发生的错误
	 */
	async dealUpdateBatch(tbName: string, fieldList: any, fieldKey: string | Record<string, string> = 'id'): Promise<{ success: any[]; error: any[] }> {
		const result = { success: [], error: [] }
		for (const record of fieldList) {
			// 根据 fieldKey 的类型提取值
			let keyValue: any
			if (typeof fieldKey === 'string') {
				keyValue = record[fieldKey]
			} else if (typeof fieldKey === 'object') {
				keyValue = pick(record, Object.keys(fieldKey))
			}
			// console.log(keyValue, '231321Vja');
			if (keyValue) {
				const count = await this.getCountByKey(tbName, fieldKey, keyValue)
				if (count) {
					// 记录已存在，执行更新
					const error = await this.update(tbName, record, fieldKey)
			// @ts-ignore 
					if (error) result.error.push(error)
			// @ts-ignore 

					else result.success.push(record)
				} else {
					// 记录不存在，执行插入
					const error = await this.insert(tbName, record)
			// @ts-ignore 

					if (error) result.error.push(error)
			// @ts-ignore 

					else result.success.push(record)
				}
			} else {
				const error = await this.insert(tbName, record)
			// @ts-ignore 

				if (error) result.error.push(error)
			// @ts-ignore 

				else result.success.push(record)
			}
		}

		return result
	}
	/**
	 * 根据条件查询记录数
	 * @param {string} tbName 表名
	 * @param {string} condition 查询条件，例如 "name = 'zxl' AND loginTime > 10 AND sal IN (5000, 3000, 1500)"
	 * @returns {Promise<number>} 返回符合条件的记录数
	 */
	async countRecords(tbName: string, condition: string | Object): Promise<number> {
		let sql = `SELECT COUNT(*) AS count FROM ${tbName}`
		if (isString(condition)) sql += ` WHERE ${condition}`
		else {
			const conditionStrings = getConditionsSql(condition as object)
			sql += ` WHERE ${conditionStrings}`
		}

		const result = await this.selectSql(sql)
		return result[0]?.count || 0
	}

	/**
	 * 根据指定的键和值查询表中符合条件的记录数
	 * @param {string} tbName - 表名
	 * @param {string|Record<string, string>} key - 用于查询的字段名，默认为 'id'
	 * @param {any} value  - 查询条件的值，例如特定的 ID 或其他字段值
	 * @returns {Promise<number>} - 返回符合条件的记录数
	 */
	async getCountByKey(tbName: string, key: string | Record<string, string> = 'id', value: any): Promise<number> {
		let sql = `SELECT COUNT(*) AS count FROM ${tbName}`

		if (key) {
			if (isString(key) && value) {
				sql += ` WHERE ${key} = '${value}'`
			} else if (isObject(key)) sql += ` WHERE ${map(key, (v, k) => `${k} = ${JSON.stringify(v)}`).join(' AND ')}`
		}

		const ret = await this.selectSql(sql)
		return ret.length && ret[0] && ret[0].count ? ret[0].count : 0
	}

	/**
	 * 根据条件获取统计数
	 * @param {*} tbName 表名
	 * @param {*} condition 条件：name = 'zxl' and loginTime > 10 and sal in (5000,3000,1500)
	 * @returns Promise
	 */
	async getCountByCondition(tbName: string, condition: string): Promise<number> {
		let sql = `SELECT COUNT(*) AS count FROM ${tbName}`
		if (condition) sql += ` WHERE ${condition}`
		const ret = await this.selectSql(sql)
		return ret.length && ret[0] && ret[0].count ? ret[0].count : 0
	}

	/**
	 * 删除数据记录
	 * @param {string} tableName - 表名
	 * @param {Partial<Record<string, any>>} [conditions] - 删除条件，键值对形式，默认删除表中所有记录  或者直接sql插入
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	async delete(tableName: string, conditions?: Partial<Record<string, any>> | string): Promise<void | Error> {
		let sql = `DELETE FROM ${tableName}`

		if (conditions) {
			if (isString(conditions)) sql += ` WHERE ${conditions}`
			else {
				const conditionStrings = getConditionsSql(conditions)
				sql += ` WHERE ${conditionStrings}`
			}
		}
		// console.log(sql);
		return await this.executeSql(sql)
	}

	/**
	 * 批量删除数据记录
	 * @param {string} tableName - 表名
	 * @param {Partial<Record<string, any>>[]} conditionsList - 删除条件列表，每个条件是一个对象
	 * @returns {Promise<void[]>} - 返回每个删除操作的结果
	 * @throws {Error} - 当执行 SQL 删除操作时出现错误
	 */
	async deleteBatch(tableName: string, conditionsList: Partial<Record<string, any>>[]): Promise<void[] | Error[]> {
		const results = []
		for (const conditions of conditionsList) {
			const result = await this.delete(tableName, conditions)
			results.push(result)
		}
			// @ts-ignore 
		return Promise.all(results)
	}

	/**
	 * 删除数据库表
	 * @param {string} tableName - 要删除的表名
	 * @returns {Promise<void>} - 无返回值
	 * @throws {Error} - 当执行 SQL 删除表操作时出现错误
	 *
	 * @description
	 * 执行 SQL 命令 `DROP TABLE IF EXISTS` 来删除指定的表。如果表不存在，会报error
	 */
	async dropTable(tableName: string): Promise<void | Error> {
		return await this.executeSql(`DROP TABLE IF EXISTS ${tableName}`)
	}

	/**
	 * 清空数据库表中的所有数据
	 * @param {string} tableName - 要清空数据的表名
	 * @param {Boolean} is 判断是否需要使用 TRUNCATE TABLE来清除
	 * @returns {Promise<void>} - 无返回值
	 * @throws {Error} - 当执行 SQL 清空表数据操作时出现错误
	 *
	 * @description
	 * 执行 SQL 命令 `DELETE FROM` 来删除指定表中的所有记录。此操作不会删除表结构，只会清空表中的数据。
	 * 如果表非常大，考虑使用 `TRUNCATE TABLE` 代替 `DELETE FROM` 以提高性能，具体取决于数据库系统。
	 */
	async truncateTable(tableName: string, is: boolean = false): Promise<void | Error> {
		return await this.executeSql(`${is ? 'TRUNCATE TABLE' : 'DELETE FROM'} ${tableName}`)
	}
}
export type SqliteInstance = InstanceType<typeof Sqlite>
export const sqlite: SqliteInstance = new Sqlite('h5db', '_doc/h5.db') //_doc相当于 plus.io.PRIVATE_DOC 即私人文档目录。
