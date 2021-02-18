import csv
import jieba
import regex
import pinyin
from pypinyin import pinyin as tones, Style

jieba.set_dictionary("user_dict.txt")
punc = "！？。，"
numbers = ["一","二","三","四","五","六","七","八","九","十"]
prefix_time_words = ["星期"]
suffix_time_words = ["年","月","号"]


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


def yiTone(word_before, word_after, tone_after):
	result_tone = "1"
	if word_after == None or word_before in numbers or word_after in numbers or word_before in prefix_time_words or word_after in suffix_time_words:
		result_tone = "1"
	elif tone_after == "4":
		result_tone = "2"
	else:
		result_tone = "4"
	return result_tone

def buTone(tone_after):
	result_tone = "4"
	if tone_after == "4":
		result_tone = "2"
	return result_tone

def changeTone(word_list, written_tones):
	result_tone_list = written_tones.copy()
	for i in range(len(word_list)):
		if word_list[i] == "一" or word_list[i] == "不":
			word_before = None
			word_after = None
			tone_after = None
			if i>0:
				word_before = word_list[i-1]
			if i < len(word_list) -1:
				word_after = word_list[i+1]
				tone_after = written_tones[i+1]
			if word_list[i] == "一":
				result_tone_list[i] = yiTone(word_before,word_after,tone_after)
			elif word_list[i] == "不":
				result_tone_list[i] = buTone(tone_after)
	return result_tone_list		


def spliceTone(wordWithTone):
	finalChar = wordWithTone[-1]
	result = finalChar
	if(not finalChar.isnumeric()):
		finalChar = "0" 
	return finalChar


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
			new_phrase["word_list"]=list(jieba.cut(new_phrase["phrase_no_punctuation"], cut_all=False, HMM=False))
			new_phrase["pinyin"]=[pinyin.get(word) for word in new_phrase["word_list"]]
			toneArray = tones(new_phrase["phrase_no_punctuation"], style=Style.TONE3)
			new_phrase["written_tones"]= [spliceTone(tone) for l in toneArray for tone in l]
			new_phrase["spoken_tones"]=changeTone(new_phrase["word_list"],new_phrase["written_tones"])
			phrase_list.append(new_phrase)

		word_frequencies = get_word_frequencies(phrase_list)

		while len(phrase_list) > 0:
			next_phrase = sorted(enumerate(phrase_list), key = lambda phrase: get_new_words_count_and_min_frequency(phrase[1]["word_list"], word_frequencies, words_used))[0]
			sorted_phrase_list.append(next_phrase[1])
			del phrase_list[next_phrase[0]]

		#changeTone(sorted_phrase_list)

		print(sorted_phrase_list)


get_data()