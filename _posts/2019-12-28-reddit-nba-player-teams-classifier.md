---
layout: post
title:  "Classifying Reddit NBA Posts"
date:   2019-12-28
desc: "Working with the reddit and NBA.com APIs to classify reddit/r/nba posts by team."
keywords: "reddit, NBA, APIs"
categories: [Python]
tags: [python,reddit nba]
icon: icon-python
---

As Raptors fans, we all feel like we never get the respect we deserve from US media.

Even in our 2019 Championship run, while being one of top teams in the league it felt like no pundit or NBA expert would give our beloved team a chance at winning. No matter how well the Raptors would play, it felt like we would always be a step back in importance behind what the Knicks could become 23 years from now or what Lebron had for breakfast that day.

Once Kawhi left, any little discussion we would get felt like it was just to remind listeners that the Raptors were still a team in the NBA and still played in the East -- though "obviously" no one needed to worry about them.

However, was this feeling warranted or is this just mass insecurity? Are the Raptors truly an afterthought in the US media or are Torontonians just whiny?

While not the perfect representation, I decided to explore this hypothesis using data from the reddit NBA community on reddit.com/r/nba.

My approach to researching team popularity was to extract team names from post titles of r/NBA posts that had more than 100 upvotes. However, the posts were frequently not about teams but rather about players on those teams. In order to account for that I also had to map players to their respective teams. To accomplish that, I utilized the NBA.com "commonteamroster" API endpoint.

A (lazy, not really) step by step guide of the code is below:

First we import all the libraries, which will include reddit API libraries, NBA.com api libraries, Pandas for general analysis, and Spacy to do the named entity recognition of players

```python
##import the reddit api and the pushshift API because reddit's praw API doesn't have capability to extract posts for
##specific periods.
from psaw import PushshiftAPI
import praw
from requests import Session

##NBA.com specific API endpoints
from nba_api.stats.static import teams
from nba_api.stats.endpoints import commonteamroster
from nba_api.stats.endpoints import playergamelog

##General API support libraries
import json
from datetime import datetime

##Analysis libraries
import pandas as pd
from collections import Counter

##ML Libraries
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
from spacy.matcher import Matcher
```
Creating a reddit API connection looks like this. You will need to get your client ID and client secret from reddit directly.
```python

session = Session()

reddit = praw.Reddit(client_id='YOUR REDDIT CLIENT ID',
                     client_secret='YOUR REDDIT CLIENT SECRET',
                     password='YOUR REDDIT PASSWORD',
                     requestor_kwargs={'session': session},  # pass Session
                     user_agent='testscript by /u/YOUR REDDIT USERNAME',
                     username='YOUR REDDIT USERNAME')

api = PushshiftAPI(reddit)
```
Because praw doesn't allow to extract posts by date, to pull in the data, first use the PushshiftAPI after setting the start date. This will return the list of IDs for all the posts that we want to analyze.

```python
import datetime as dt

start_epoch=int(dt.datetime(2019, 11, 1).timestamp())

df = pd.DataFrame(list(api.search_submissions(
                            after=start_epoch,
                            subreddit='nba',
                            filter=['title', 'score','id']
                            )))
```
After fetching the post IDs, feed them back through the praw API to get the other metadata that we want, namely scores and post titles.
```python
df = df.rename(columns={0: "id"})

##Make list of IDs in order to pass to PRAW format. Otherwise, will take forever. For some reason need to
##append with t3
list_of_ids = []

for i in df['id']:
    list_of_ids.append("t3_{}".format(i.id))

reddit_submissions = reddit.info(fullnames=list_of_ids)
scores = []
titles = []
created = []


for submission in reddit_submissions:
    scores.append(submission.score)
    created.append(submission.created_utc)
    titles.append(submission.title)

posts_df = pd.DataFrame(
    {'titles': titles,
     'scores': scores,
     'created': created
    })
```
I only wanted to analyze popular posts so I set a cutoff of posts with a score of 100 or greater for my analysis of the most talked about teams.

```python
top_posts_df = posts_df[posts_df['scores']>99]
```

Connecting to the NBA.com api to get a list of player-team mappings looked like this:
```python
nba_dict = {}
nba_teams = teams.get_teams()

for team in nba_teams: # BOS in example below is 2nd team
    nba_dict[team['abbreviation']] = team['id']

data = {}

season='2019-20'

for team, team_id in nba_dict.items():
    #print("doing for " + team)
    roster = commonteamroster.CommonTeamRoster(season=season, team_id=team_id)
    players_raw = roster.data_sets[0].get_dict()
    players = players_raw["data"]
    player_list = []
    for player in players:
        player_list.append([player[i] for i in (3, -1)]) # name and player_id
    data[team]=player_list
```
Utilizing the NBA.com data, I created my teams dataframe and my players dataframe.
```python
teams_df = pd.DataFrame(teams.get_teams())[['abbreviation','full_name','nickname']]

##Create a dataframe of players and their teams via the dictionary of lists.
players_df = pd.DataFrame(columns = [0,1,2])

for i,j in data.items():
    temp_df = pd.DataFrame(data[i])
    temp_df[2] = i
    players_df = pd.concat([players_df,temp_df])

players_df = players_df.rename(columns={0: "player",1:'player_id',2:'team'})

```
This next part is a bit convoluted and perhaps underoptimized but its where I utilize spacy's matcher class to extract player names from post titles. With the script below, we create named entities for player full names, team names and player last names.

```python
import spacy
nlp = spacy.load('en')

teams_df['tag'] = 'TEAM'
players_df['tag'] = 'PLAYER'

matcher = Matcher(nlp.vocab,validate=True)

players_df[['first_name','last_name']] = players_df['player'].str.split(" ", 1, expand=True)
players_df[['first_name','last_name']]=players_df[['first_name','last_name']].fillna('nene')


for index, row in players_df.iterrows():
    pattern = [{'TEXT': row['first_name'].lower()}, {'TEXT': row['last_name'].lower()}]
    matcher.add('PLAYER NAME', None, pattern)

for index, row in teams_df.iterrows():
    pattern = [{'TEXT': row['nickname'].lower()}]
    matcher.add('TEAM', None, pattern)

for index, row in teams_df.iterrows():
    pattern = [{'TEXT': row['city'].lower()}]
    matcher.add('CITY', None, pattern)

for index, row in teams_df.iterrows():
    pattern = [{'TEXT': row['abbreviation'].lower()}]
    matcher.add('TEAM', None, pattern)

for index, row in players_df.iterrows():
    pattern = [{'TEXT': row['last_name'].lower()}]
    matcher.add('LAST', None, pattern)

##Custom cheating code
matcher.add('LAST', None, [{'TEXT': 'lebron'}])
matcher.add('LAST', None, [{'TEXT': 'oubre'}])

def players_found(val):
    player_token_list = []
    doc = nlp(val.lower())
    matches = matcher(doc)
    for match_id, start, end in matches:
        string_id = doc.vocab.strings[match_id]  # Look up string ID
        span = doc[start:end]

        if string_id == 'PLAYER NAME':
            player_token_list.append(span.text)

    return player_token_list

def teams_found(val):
    team_token_list = []
    #doc = nlp(top_posts_df['titles'].values[3].lower())
    doc = nlp(val.lower())
    matches = matcher(doc)
    for match_id, start, end in matches:
        string_id = doc.vocab.strings[match_id]  # Look up string ID
        span = doc[start:end]

        if string_id == 'TEAM':
            team_token_list.append(span.text)

    return team_token_list

def last_name_found(val):
    name_token_list = []
    doc = nlp(val.lower())
    matches = matcher(doc)
    for match_id, start, end in matches:
        string_id = doc.vocab.strings[match_id]  # Look up string ID
        span = doc[start:end]

        if string_id == 'LAST':
            name_token_list.append(span.text)

    return name_token_list

def city_found(val):
    team_token_list = []
    #doc = nlp(top_posts_df['titles'].values[3].lower())
    doc = nlp(val.lower())
    matches = matcher(doc)
    for match_id, start, end in matches:
        string_id = doc.vocab.strings[match_id]  # Look up string ID
        span = doc[start:end]

        if string_id == 'CITY':
            team_token_list.append(span.text)

    return team_token_list

top_posts_df['teams_found'] =  top_posts_df['titles'].apply(lambda x: teams_found(x))
top_posts_df['players_found'] =  top_posts_df['titles'].apply(lambda x: players_found(x))
top_posts_df['last_name_found'] =  top_posts_df['titles'].apply(lambda x: last_name_found(x))
top_posts_df['city_found'] =  top_posts_df['titles'].apply(lambda x: city_found(x))
```
At this point, we have four new columns in our top posts that extract player and teams specific data from post titles.

What we want to do next is to be able to map player names to their respective teams so that we can do a histogram of team mentions by top posts.

For player full names and team cities, the match is 1 to 1, however, player last names aren't always unique. Harden, we know is James Harden, but a mention of "Matthews" could refer to several players so we can't extract a specific player from a mention of just that last name.

To extract some addtional juice from mentions of prominent last names, we have to take a bit of a detour and extract all unique player last names. The cosine_similarity approach below might be unecessary but unfortunately that's what first came to mind.

```python
##Create a set of all player last names to see which are unique enough for additional data exraction.

players_df['player_lower'] = players_df['player'].apply(lambda x: x.lower())
teams_df['nickname_lower'] = teams_df['nickname'].apply(lambda x: x.lower())
teams_df['city_lower'] = teams_df['city'].apply(lambda x: x.lower())


def get_cosine_sim(*strs):
    vectors = [t for t in get_vectors(*strs)]
    return cosine_similarity(vectors)

def get_vectors(*strs):
    text = [t for t in strs]
    vectorizer = CountVectorizer(text)
    vectorizer.fit(text)
    return vectorizer.transform(text).toarray()


last_name_list = []
for val in top_posts_df['last_name_found']:
    for players in val:
        last_name_list.append(players)

last_name_set = set(last_name_list)

##map those last names to the full names.
last_name_players_dict = {}
for name in last_name_set:
    sim = players_df['player_lower'].apply(lambda x: get_cosine_sim(name,x)[1][0])
    list_of_players = players_df.iloc[sim[sim>0.5].index]['player_lower'].values

    if len(list_of_players) == 1:
        last_name_players_dict[name] = list_of_players[0]

def player_match_v3(val):
    temp_list = []

    for player in val:
        if player in last_name_players_dict.keys():
            temp_list.append(last_name_players_dict[player])
    return temp_list

top_posts_df['players_mapped_from_last_name'] = top_posts_df['last_name_found'].apply(lambda x: player_match_v3(x))
```

Once you have extracted data from last names, full names, and cities, its time to start consolidating them to the final "nickname" format that we'll be calculating the distribution over.

```python
##add team nickname to the players_df to use in the player matching.
players_df = players_df.merge(teams_df[['abbreviation','nickname_lower','city_lower']], left_on ='team', right_on ='abbreviation').drop(['abbreviation'],axis=1)

##Create a dictionary of all player-team mappings as the lookup reference for categorizing players in your posts df
players_dict = {}
for index, row in players_df[['player_lower','nickname_lower']].iterrows():
    players_dict[row['player_lower']] = row['nickname_lower']

##Create a dictionary of all city-nickname mappings as the lookup reference for categorizing cities in your posts df
cities_dict = {}
for index, row in teams_df[['city_lower','nickname_lower']].iterrows():
  cities_dict[row['city_lower']] = row['nickname_lower']

##Create a function to map players to teams in top_posts_df
def players_mapping(val):
    teams_list = []
    for player in val:
        teams_list.append(players_dict[player])
    return teams_list


##Create a function to map cities to teams in top_posts_df
def city_mapping(val):
    cities_list = []
    for city in val:
        cities_list.append(cities_dict[city])
    return cities_list

#map players to teams
top_posts_df['player_last_name_teams'] = top_posts_df['players_mapped_from_last_name'].apply(lambda x: players_mapping(x))

#map players to teams
top_posts_df['player_teams'] = top_posts_df['players_found'].apply(lambda x: players_mapping(x))

#map cities to teams
top_posts_df['city_teams'] = top_posts_df['city_found'].apply(lambda x: city_mapping(x))

```
The final step is to deduplicate all the overlapping categorizations by setting the teams.

```python
##combine info from explicit mentions of teams and teams mapped through player mentioned; deduplicate teams mentioned
def add_and_set(val):
    x = val['teams_found'] + val['player_teams'] + val['player_last_name_teams'] + val['city_teams']
    y = set(x)
    return y

top_posts_df['teams_mentioned_clean'] = top_posts_df.apply(lambda x: add_and_set(x),axis = 1)
```
At this point you can use the top_posts_df as you wish. You can export it to csv...

```python
top_posts_df.to_csv('reddit_nba_posts.csv')
```

...or you can use Counter to get your count of team mentions within Python.
```python
## Count the mentions of each team in our final column
teams_mention_count = Counter()
for row in top_posts_df['teams_mentioned_clean']:
    for val in row:
        teams_mention_count[val]+=1

print(teams_mention_count)
```
