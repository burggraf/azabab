/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("7wif1o0ptbkqeej")

  collection.options = {
    "query": "select (ROW_NUMBER() OVER()) as id, count(*) as \"count\",category,subcategory from trivia group by category, subcategory order by category, subcategory"
  }

  // remove
  collection.schema.removeField("uapscpxq")

  // remove
  collection.schema.removeField("gtnil6vn")

  // remove
  collection.schema.removeField("rx9xtxxg")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "unexlane",
    "name": "count",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "8s4byiec",
    "name": "category",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "m3brv7a2",
    "name": "subcategory",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("7wif1o0ptbkqeej")

  collection.options = {
    "query": "select (ROW_NUMBER() OVER()) as id, count(*) as count,category,subcategory from trivia group by category, subcategory order by category, subcategory"
  }

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "uapscpxq",
    "name": "count",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "gtnil6vn",
    "name": "category",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "rx9xtxxg",
    "name": "subcategory",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // remove
  collection.schema.removeField("unexlane")

  // remove
  collection.schema.removeField("8s4byiec")

  // remove
  collection.schema.removeField("m3brv7a2")

  return dao.saveCollection(collection)
})
