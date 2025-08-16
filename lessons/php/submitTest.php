<?php

$lessonId   = $_POST["lessonId"];
$student    = $_POST["student"];
$nProblems  = $_POST["nProblems"];
$score      = $_POST["score"];
$totalScore = $_POST["totalScore"];

$to = "corbin.holland@gmail.com";
$subject = "Chess Lesson {$lessonId}";
$message = "Student: {$student} -- Score: {$totalScore}/{$nProblems} -- \n";
$message = $message . "[ ";
for ($i = 0; $i < count($score) ; $i++) {
	if ($i < (count($score)-1)) {
	    $message = $message . $score[$i] . ",";
    } else {
    	$message = $message . $score[$i];
    }
}
$message = $message . " ]";
           
$from = "corbin.holland@gmail.com";
$headers = "From:" . $from;
mail($to,$subject,$message,$headers);
echo "Mail Sent.";

?>