<?php if (!defined('APPLICATION')) exit();

// Define the plugin:
$PluginInfo['MentionsLookup'] = array(
   'Name' => 'MentionsLookup',
   'Description' => 'When a user type @ in a post followed by a letter a drop down opens with users to insert',
   'Version' => '0.1.6b',
   'RequiredApplications' => array('Vanilla' => '2.0.18'),
   'Author' => "Paul Thomas",
   'AuthorEmail' => 'dt01pqt_pt@yahoo.com',
   'AuthorUrl' => 'http://vanillaforums.org/profile/x00',
   'RequiredTheme' => FALSE, 
   'RequiredPlugins' => FALSE,
   'MobileFriendy' => TRUE,
   'HasLocale' => FALSE
);

class MentionsLookup extends Gdn_Plugin {

   public function LoadLookup($Sender){
     $Sender->AddJsFile($this->GetResource('js/rangy-core.js', FALSE, FALSE));
     $Sender->AddJsFile($this->GetResource('js/textinputs_jquery.js', FALSE, FALSE));
     $Sender->AddJsFile($this->GetResource('js/query.js', FALSE, FALSE));
   
   }

   public function DiscussionController_Render_Before($Sender) {
      $this->LoadLookup($Sender);
   }
   
   public function PostController_Render_Before($Sender) {
      $this->LoadLookup($Sender);
   }
   

}
