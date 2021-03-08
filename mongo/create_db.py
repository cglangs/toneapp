import order_phrases
from pymongo import MongoClient

client = MongoClient()
#client.drop_database('tone_db')
'''
intervals_data = [
	{"interval_id": 0, "seconds": 0},
	{"interval_id": 1, "seconds": 5},
	{"interval_id": 2, "seconds": 25},	
	{"interval_id": 3, "seconds": 120},
	{"interval_id": 4, "seconds": 600},
	{"interval_id": 5, "seconds": 3600},
	{"interval_id": 6, "seconds": 18000},
	{"interval_id": 7, "seconds": 86400},
	{"interval_id": 8, "seconds": 432000},
	{"interval_id": 9, "seconds": 2160000},
	{"interval_id": 10, "seconds": 10510000}
]
'''
phrase_data = order_phrases.get_data()
db = client.tone_db

phrases = db.phrases
decks = db.decks
#intervals = db.intervals
db.decks.insert_one({"deck_id": 1, "deck_name": "HSK1 Words and Phrases"})
db.phrases.insert_many(phrase_data)
print("DB CREATED")
#db.intervals.insert_many(intervals_data)







