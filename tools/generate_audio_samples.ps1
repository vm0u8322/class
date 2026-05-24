$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$classDir = "E:\MochiClassFree\example"
$items = @(
  @{ File = "rec_ax19_q.wav"; Text = "English class sample recording. Today we practice formal email writing, short presentation structure, opening sentences, key points, and a clear closing." },
  @{ File = "rec_db77_l.wav"; Text = "Database systems practice sample recording. This lecture explains ER model, primary key, foreign key, and SQL join queries for students and courses." },
  @{ File = "rec_st40_p.wav"; Text = "Applied statistics sample recording. The key ideas are mean, variance, standard deviation, normal distribution, Z score, hypothesis testing, and p value." },
  @{ File = "rec_ml88_t.wav"; Text = "Machine learning and deep learning sample recording. This class covers supervised learning, train validation test split, overfitting, regularization, decision tree, random forest, and CNN." },
  @{ File = "rec_ie20_n.wav"; Text = "Intelligent engineering and modern technology sample recording. We discuss smart manufacturing, internet of things sensor data, engineering decisions, artificial intelligence, automation, and cloud platforms." },
  @{ File = "rec_ec91_z.wav"; Text = "Electronic commerce and online marketing sample recording. The lecture covers ecommerce business models, SEO, keyword strategy, social media content planning, conversion rate, and member management." },
  @{ File = "rec_mb7a_x.wav"; Text = "Mobile application development sample recording. This session introduces activity, view model, user interface layout, API integration, local storage, and a todo list application." },
  @{ File = "rec_net31_f.wav"; Text = "Computer networking sample recording. The main topics are TCP IP, packet transmission, OSI layers, IP address, subnet mask, gateway, DNS lookup, and three way handshake." },
  @{ File = "rec_lnx09_a.wav"; Text = "Linux system sample recording. Today we practice pwd, ls, cd, cat, chmod, file permissions, users, groups, process management, and shell script basics." },
  @{ File = "rec_prj2_f.wav"; Text = "Information management capstone project sample recording. This week checks requirement interviews, feature lists, wireframes, database design, core system demo, and final presentation script." }
)

foreach ($item in $items) {
  $path = Join-Path $classDir $item.File
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.Rate = -2
  $synth.Volume = 100
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($item.Text)
  $synth.Dispose()
}
