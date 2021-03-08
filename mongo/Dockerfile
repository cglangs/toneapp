FROM python:3.7-stretch
RUN pip3 install pymongo
RUN pip3 install jieba
RUN pip3 install regex

COPY . .

RUN python3 create_db.py
