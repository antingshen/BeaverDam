BeaverDam
=========

Video annotation tool for deep learning training labels

## About

This tool is for drawing object bounding boxes in videos. It also includes support for Amazon Mechanical Turk. See the [paper](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2016/EECS-2016-193.html).

With small amount of changes, you can also:
- Draw bounding boxes in images
- Add additional attributes in bounding boxes
- Use a custom keyframe scheduler instead of user-scheduled keyframes

This tool currently does not support semantic segmentation.

## Installation

 1. Clone this repository.
 2. `cd BeaverDam`
 3. Make sure Python 3 is installed.  
    If not: `brew install python3` (Mac) or `sudo apt-get install python3` (Ubuntu)
 3. Make sure virtualenv is installed.  
    If not: `pip3 install virtualenv` or maybe `sudo pip3 install virtualenv`
 4. Make the Python virtualenv for this project:  
    `scripts/setup`
 5. Download sample data:  
    `scripts/seed -f`

When running any `./manage.py` commands, use `source venv/bin/activate` to enter venv first.

See `/deployment` for tips on using BeaverDam for production.

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

Then navigate to [localhost:5000](http://localhost:5000/) in your browser.

Need to run on a custom port? `env PORT=1234 scripts/serve`

For actual production deployment, we recommend using standard Django deployment procedures. Sample scripts using uWSGI & nginx are provided in `/deployment`. Remember to set `DEBUG=False` in `settings.py`. 

### Making accounts

Login is required to authenticate any changes. Turkers do not require accounts and are authenticated by BeaverDam via Mechanical Turk. 

To make a superuser account, run inside venv `./manage.py createsuperuser`
If you are using sample data, login with username `test` and password `password`.
Additional non-turker worker accounts can be created via `/admin`. 

### Videos

To add videos via web UI, navigate to `/admin` and create Video objects. 
Alternatively, use `./manage.py shell`, and create `annotator.Video` objects and call `video.save()`.
Helper methods exist to create large number of video objects at once, see `annotator/models.py`.

Video objects can either be H.264 encoded video (See `scripts/convert-to-h264`), or a list of frames provided in the attribute `image_list`.
By using single-frame videos, BeaverDam can be used for image annotation.

Video annotations can be accessed via admin, `/annotation/video_id`, or through the Video objects' annotation attribute through the shell.

### Tasks

Tasks are created in the same way as Videos. 
Only the `video` attribute needs to be filled out at creation time.
They can be published to mturk by calling `task.publish()`. 

### Simulating mturk view in debug

To see what video pages look like on mturk preview mode, set url param `preview=true`.
For mturk's HIT accepted mode, set url param `mturk=true`.

Example: `localhost:5000/video/0/?mturk=true`

### Running tests

Inside venv, run `./manage.py test`

## Contributing

Pull requests and contributions are welcome. 
See [annotator/static/README.md](annotator/static) for more info on frontend architecture.

## Support

For help setting up BeaverDam for your application/company, please contact me or leave an issue.
