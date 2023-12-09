/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("sy1tel6mzli6fdu")

  collection.listRule = ""

  // remove
  collection.schema.removeField("hapoecvh")

  // remove
  collection.schema.removeField("eazzj0mj")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mbha9tbg",
    "name": "correct",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lczi1dxf",
    "name": "total",
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

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("sy1tel6mzli6fdu")

  collection.listRule = null

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "hapoecvh",
    "name": "correct",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "eazzj0mj",
    "name": "total",
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

  // remove
  collection.schema.removeField("mbha9tbg")

  // remove
  collection.schema.removeField("lczi1dxf")

  return dao.saveCollection(collection)
})
