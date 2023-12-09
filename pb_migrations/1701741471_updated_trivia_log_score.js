/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("sy1tel6mzli6fdu")

  collection.listRule = "id = @request.auth.id"
  collection.viewRule = "id = @request.auth.id"

  // remove
  collection.schema.removeField("mbha9tbg")

  // remove
  collection.schema.removeField("lczi1dxf")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "yakindjv",
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
    "id": "oesj3hk6",
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

  collection.listRule = ""
  collection.viewRule = ""

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

  // remove
  collection.schema.removeField("yakindjv")

  // remove
  collection.schema.removeField("oesj3hk6")

  return dao.saveCollection(collection)
})
