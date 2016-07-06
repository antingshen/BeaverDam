# BeaverDam
Video annotation tool for deep learning training labels

## Installation

Make sure `virutalenv` is installed on your computer. Search for OS specific instructions.

Clone the repository

```
cd BeaverDam
virtualenv -p python3 venv
. venv/bin/activate
pip3 install -r requirements.txt
```

#### Download Sample Database
`wget https://s3-us-west-2.amazonaws.com/beaverdam/db.sqlite3 db.sqlite3`

#### Download Sample Data (Optional)

Download `https://s3-us-west-2.amazonaws.com/beaverdam/test_vid.zip` and extract into
`BeaverDam/static/videos/test_vid`

#### Export mturk Keys (only required for mturk module)

Replace the credentials below with your own
```
export MTURK_ID="AKIAAAAYOURIDHERE"
export MTURK_KEY="YOURmturkKEYhere5DyUrkm/81SRSMG+5174"
```
When ready for real turkers, edit `MTURK_SANDBOX` to `False` in `settings.py`.

## Running the Server

`./run_server`
Then navigate to `localhost:5000/video/test_vid` in your browser.

