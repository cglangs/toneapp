import csv
import jieba
import regex

jieba.set_dictionary("user_dict.txt")
punc = "！？。，"


def get_word_frequencies(phrase_list):
	word_frequencies={}
	for phrase in phrase_list:
		for word in phrase["word_list"]:
			if word not in word_frequencies:
				word_frequencies[word] = 0
			word_frequencies[word] += 1
	return word_frequencies


def order_phrases(phrase_list, word_frequencies):
	return None

def get_data():
	with open('phrases_edited.tsv') as csvfile:
		phrase_list=[]
		readCSV = csv.reader(csvfile, delimiter='\t')
		phrases = list(readCSV)
		for phrase in phrases:
			new_phrase = {}
			new_phrase["full_phrase"]=phrase[0]
			new_phrase["phrase_no_punctuation"]=regex.sub(r"[{}]+".format(punc), "", phrase[0])
			new_phrase["word_list"]=list(jieba.cut(new_phrase["phrase_no_punctuation"], cut_all=False, HMM=False))
			phrase_list.append(new_phrase)
		word_frequencies = get_word_frequencies(phrase_list)


get_data()