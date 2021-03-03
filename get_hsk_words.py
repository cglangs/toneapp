import csv

def get_words():
	with open('hsk/pseudo_hsk1.tsv') as csvfile:
		word_dict = {}
		readCSV = csv.reader(csvfile, delimiter='\t')
		words = list(readCSV)
		for word in words:
			nextDict ={}
			nextDict["tones"] = word[2]
			nextDict["pinyin"] = word[3]
			word_dict[word[0]] = nextDict
		return word_dict
