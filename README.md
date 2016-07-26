BeaverDam
=========

Video annotation tool for deep learning training labels


## Installation

Make sure `virutalenv` is installed on your computer. Search for OS specific instructions.

1. Clone the repository
2. `cd BeaverDam`
3. Install `virtualenv` (probably via `pip3 install virtualenv`)
4. `scripts/setup` to make the Python venv
5. `scripts/seed` to download sample database and data

### If using mturk

Replace the credentials below with your own:

```bash
export AWS_ID="AKIAAAAYOURIDHERE"
export AWS_KEY="YOURmturkKEYhere5DyUrkm/81SRSMG+5174"
```

When ready for real turkers, edit `MTURK_SANDBOX` to `False` in `settings.py`.

It is recommended to use IAM keys with only mturk permissions instead of root key.


## Running the server

```shell
scripts/serve
```

Then navigate to <a href="http://localhost:5000/" target="_blank">localhost:5000</a> in your browser.

Need to run on a custom port? `env PORT=1234 ./run_server`


## Contributing

See [annotator/static/README.md]() for more info.
