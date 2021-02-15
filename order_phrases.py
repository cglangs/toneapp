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

def get_new_words_count_and_min_frequency(word_list, word_frequencies, words_used):
	new_words = [word for word in word_list if word not in words_used]
	return len(new_words),  -1 * min([word_frequencies[word] for word in new_words])

def get_data():
	with open('phrases_edited.tsv') as csvfile:
		phrase_list=[]
		sorted_phrase_list = []
		words_used = set()
		readCSV = csv.reader(csvfile, delimiter='\t')
		phrases = list(readCSV)
		
		for phrase in phrases:
			new_phrase = {}
			new_phrase["full_phrase"]=phrase[0]
			new_phrase["phrase_no_punctuation"]=regex.sub(r"[{}]+".format(punc), "", phrase[0])
			new_phrase["word_list"]=list(jieba.cut(new_phrase["phrase_no_punctuation"], cut_all=False, HMM=False),)
			phrase_list.append(new_phrase)
		word_frequencies = get_word_frequencies(phrase_list)

		while len(phrase_list) > 0:
			next_phrase = sorted(enumerate(phrase_list), key = lambda phrase: get_new_words_count_and_min_frequency(phrase[1]["word_list"], word_frequencies, words_used))[0]
			sorted_phrase_list.append(next_phrase[1])
			del phrase_list[next_phrase[0]]

		print(sorted_phrase_list)


get_data()