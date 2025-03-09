import os
from flask import Flask, render_template

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# OpenWeather API key from environment variable
WEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "69ebf373e2270f8f20f526d624657377")

@app.route('/')
def index():
    return render_template('index.html', api_key=WEATHER_API_KEY)
