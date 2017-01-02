new_name="/home/alex/BeaverDam/backup.xylabel.$(date +"%Y-%m-%d_%H-%M").sqlite3"

if [ -f $new_name ]; then
   echo "$new_name already exists - deleting first"
   rm $new_name
fi
if [ -f "$new_name.gz" ]; then
   echo "$new_name.gz already exists - deleting first"
   rm "$new_name.gz"
fi

cp /home/alex/BeaverDam/db.sqlite3 $new_name

gzip $new_name
gsutil cp "$new_name.gz" gs://xy-backups
rm "$new_name.gz"
