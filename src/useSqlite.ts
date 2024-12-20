import { sqlite } from './dbhelper'
/**
 * @param {string} table 表名
 * @param {Record<string, string>} schema 表结构信息等
 * @param key 主键
 */
export const useSqlite = (table: string, schema?: Record<string, string>, key?: string) => {
	const init = async () => {
		// sqlite.dropTable(table);
		console.log('sqlite.isOpen()', sqlite.isOpen())
		/** 判断有没有打开数据库   没有就打开 */
		if (!sqlite.isOpen()) await sqlite.openSqlite()
		/** 判断有没有传数据类型   有的话就 判断有没有表格 有的话 判断 当前字段对不对  没有的话 创建表  */
		if (schema) await sqlite.createTable(table, schema, key)
		await updateTable()
	}

	// sqlite.dropTable(table);

	/**
	 * 插入数据
	 * @param {Record<string, any>} conditions 要插入的数据对象 或sql 语句
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	const insert = async (conditions: Record<string, any> | string): Promise<void | Error> => await sqlite.insert(table, conditions)
	/**
	 * 更新数据
	 * @param {Record<string, any>} conditions 要插入的数据对象 或sql 语句
	 * @param {string} [fieldKey='id'] - 作为唯一标识的字段名，默认值为 'id'
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 */
	const update = async (conditions: Record<string, any>, fieldKey: string | Record<string, string> = 'id'): Promise<void | Error> =>
		await sqlite.update(table, conditions, fieldKey)

	/** @function  insertBatch
	 * 批量更新记录，如果记录不存在则插入新记录
	 * @param {any[]} fieldList - 需要更新或插入的记录列表，每条记录是一个对象，包含待操作的数据
	 * @param {string} [fieldKey='id'] - 作为唯一标识的字段名，默认值为 'id'
	 * @returns {Promise<{ success: any[]; error: any[] }>} - 返回一个对象，其中：
	 *   - `success` 是一个数组，包含成功更新或插入的记录的结果
	 *   - `error` 是一个数组，包含在处理过程中发生的错误
	 */
	const insertBatch = async (fieldList: any[], fieldKey: string | Record<string, string> = 'id'): Promise<{ success: any[]; error: any[] }> =>
		sqlite.dealUpdateBatch(table, fieldList, fieldKey)

	/**
	 * 查询表单数据
	 */
	const select = async (filter?: Partial<Record<string, any>> | string, isFuzzy?: boolean) => sqlite.select(table, filter, isFuzzy)

	/**
	 * 分页查询数据
	 *
	 * @param {number|string} pageNumber - 当前页码（可以是数字或字符串）
	 * @param {number|string} pageSize - 每页的记录条数（可以是数字或字符串）
	 * @param { Partial<Record<string, any>> } conditions 查询条件
	 * @param {Boolean} isFuzzy - 是否进行模糊查询，默认为 false
	 * @param {string} [orderBy] - 可选的排序字段（如 "column_name ASC" 或 "column_name DESC"）
	 * @param {Boolean} desc 是否降序
	 * @returns {Promise<any>} 返回查询结果的数据
	 */
	const selectPage = async (
		pageNumber: string | number = 1,
		pageSize: string | number = 10,
		conditions?: Partial<Record<string, any>>,
		isFuzzy?: boolean,
		orderBy?: string,
		desc?: Boolean,
	): Promise<any> => sqlite.selectPage(table, pageNumber, pageSize, conditions, isFuzzy, orderBy, desc)

	/**
	 * 根据条件删除表单数据
	 * @param
	 */
	const sqldelete = async (conditions?: any) => await sqlite.delete(table, conditions)

	/**
	 * 如果更新字段要调用这个方法 sqlite的版本比较低只能新增不能删字段
	 * @param
	 */
	const updateTable = async () => {
		let res = await sqlite.checkTableExists(table)
		if (res && res.length > 0) {
			let re = await sqlite.selectPragma(table)
			if(!schema) return
			const ar = Object.keys(schema)
			/**取新字段  */
			const ac = ar.filter((d) => !re.some((i) => i.name === d))
			/**取多于的字段 需要删除的 */
			// const arp = re.filter((d) => !ar.some((i) => i === d.name));
			/** 需要执行的sql */
			/* 	const sqlArr = [
				...arp.map(({ name }) => `ALTER TABLE silk_cart_db DROP ${name}`),
				...ac.map((a) => `ALTER TABLE silk_cart_db ADD COLUMN ${a} ${schema[a]}`),
			]; */
			const sqlArr = ac.map((a) => `ALTER TABLE ${table} ADD COLUMN ${a} ${schema[a]}`)
			if (sqlArr.length > 0) {
				let reE = await sqlite.executeSql(sqlArr)
				console.log(`column:${sqlArr} 结果：${JSON.stringify(reE)}`)
				return reE
			}
		}
	}
	/**关闭数据库
	 * @returns {Promise<void|Error>} 成功无返回值 ，失败时返回错误
	 减少了sqlite 而已  */
	const closeSqlite = (): Promise<void | Error> => sqlite.closeSqlite()

	init()
	return { sqlite, insert, update, insertBatch, select, sqldelete, selectPage, updateTable, closeSqlite }
}
