aino (Bonfire)
====
Running (hopefully) at http://secure-wildwood-3516.herokuapp.com/

To run locally in a shell, git the repository, cd into it, and call:
  pip install -r requirements.txt
  python app.py

Bugs:
Repeats series of videos if API requests are made in a cluster (not sure if this is an issue with caching - obviously is if requests are 
being made with less than 15 seconds between each other - or if the most recent tweets at the time of both API calls are the same list
according to Twitter)
API calls for an array of videos tagged with a certain tag time out if there are fewer recent videos than requested videos with the tag 
