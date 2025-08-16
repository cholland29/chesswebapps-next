<?php

$uniqueId   = $_POST["uniqueId"];
$trackId    = $_POST["trackId"];
$trackTitle = $_POST["trackTitle"];
$student    = $_POST["student"];
$problemId  = $_POST["problemId"];
$score      = $_POST["score"];
$advance    = $_POST["advance"];

$date = date_create();
$dateString = date_format($date, 'Y-m-d H:i:s');

$to = "corbin.holland@gmail.com";
$subject = "Track: {$trackTitle} -- Track Id: {$trackId} -- Problem: {$problemId}";
$message = "Timestamp: {$dateString}\n";
$message .= "Track: {$trackTitle} -- Track Id: {$trackId} -- Problem: {$problemId}\n";
$message .= "Student: {$uniqueId}\n";
$message .= "Score: {$score}\n";
$message .= "Advance: {$advance}\n";
           
$from = "corbin.holland@gmail.com";
$headers = "From:" . $from;
mail($to,$subject,$message,$headers);
echo "Mail Sent.";
echo "Can you see this too?";

$file = 'trackLog.txt';

// Write the contents to the file, 
// using the FILE_APPEND flag to append the content to the end of the file
// and the LOCK_EX flag to prevent anyone else writing to the file at the same time
$ret = file_put_contents($file, $message, FILE_APPEND | LOCK_EX);
echo "trackLog.txt::file_put_contents returned  = {$ret}";

?>