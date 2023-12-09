/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "7wif1o0ptbkqeej",
    "created": "2023-12-04 13:52:36.930Z",
    "updated": "2023-12-04 13:52:36.930Z",
    "name": "trivia_counts",
    "type": "view",
    "system": false,
    "schema": [
      {
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
      },
      {
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
      },
      {
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
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {
      "query": "select (ROW_NUMBER() OVER()) as id, count(*) as count,category,subcategory from trivia group by category, subcategory order by category, subcategory"
    }
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("7wif1o0ptbkqeej");

  return dao.deleteCollection(collection);
})
