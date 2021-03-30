# Mandarin Tone Practice App

## Description

This application is a tool for practicing pronunciaion of tones in Mandarin phrases. It records your voice, and will detect the tone in your voice using a maching learning model (fastai) built using the Tone Perfect dataset: https://tone.lib.msu.edu/. It does not include the neutral tone. A video describing it's functionality can be found here: https://youtu.be/Z0M-aPYCWY0.

## Requirements
* git
* docker

**Steps to prepare environment:**

- Clone repository 
- `git clone git@github.com:cglangs/toneapp.git` 

- Create mongo volume
- `mkdir mongo-volume`

- Start mongo database
- `docker-compose up -d db`

- Wait 10 seconds for database to start

- Run app
- `docker-compose up`

- Open `http://localhost:3003/` in browser 
