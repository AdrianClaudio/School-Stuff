<?php
////////////////////////////////////////////////////////////////////////
/// This file defines all of the default tags (used in most themes)  ///
////////////////////////////////////////////////////////////////////////


/** General utility variable: The base URL path of the Drupal installation. At the very least, this will always default to /. */
global $base_path; 
/** General utility variable: An array of CSS files for the current page.*/
global $css; 

/** General utility variable: The directory the theme is located in, e.g. themes/garland or themes/garland/minelli.*/
global $directory; 

/** General utility variable: TRUE if the current page is the front page. Used to toggle the mission statement.*/
global $is_front; 

/** General utility variables: TRUE if the user is registered and signed in.*/
global $logged_in; 

/** General utility variables: TRUE if the user has permission to access administration pages.*/
global $is_admin; 
 
/** Pseudo-class, does not really exist; the type of the "$language" object */
class _Language_{
   /** Textual representation of the language the site is being displayed in. */
   public $language;
   /**  Contains the language direction. It will either be 'ltr' or 'rtl'. */
   public $dir;
};

/** Page metadata: The language the site is being displayed in. (object) */
global $language;
$language = new _Language_;


/** Page metadata:A modified version of the page title, for use in the TITLE tag.*/
global $head_title; 

/** Page metadata: Markup for the HEAD section (including meta tags, keyword tags, and so on). */
global $head; 

/** Page metadata: Style tags necessary to import all CSS files for the page.*/
global $styles; 

/** Page metadata: Script tags necessary to load the JavaScript files and settings for the page.*/
global $scripts; 

/** Page metadata: A set of CSS classes for the BODY tag. This contains flags indicating the current layout (multiple columns, single column), the current path, whether the user is logged in, and so on. */
global $body_classes; 
 
 
 
/** Site identity: The URL of the front page. Use this instead of $base_path, when linking to the front page. This includes the language domain or prefix. */
global $front_page; 

/** Site identity: The path to the logo image, as defined in theme configuration. */
global $logo; 

/** Site identity: The name of the site, empty when display has been disabled in theme settings.*/
global $site_name; 

/** Site identity: The slogan of the site, empty when display has been disabled in theme settings. */
global $site_slogan; 

/** Site identity: The text of the site mission, empty when display has been disabled in theme settings.*/
global $mission; 
 

/** Navigation: HTML to display the search box, empty if search has been disabled.*/
global $search_box; 

/** Navigation: An array containing primary navigation links for the site, if they have been configured.*/
global $primary_links; 
$primary_links = array();

/** Navigation: An array containing secondary navigation links for the site, if they have been configured.*/
global $secondary_links;
$secondary_links = array();


/** Page content: The HTML for the left sidebar. */
global $left; 

/** Page content:  The breadcrumb trail for the current page.*/
global $breadcrumb;

/** Page content: The page title, for use in the actual HTML content.*/
global $title; 
/** Page content: Dynamic help text, mostly for admin pages.*/
global $help; 

/** Page content: HTML for status and error messages. Should be displayed prominently.*/
global $messages; 

/** Page content: Tabs linking to any sub-pages beneath the current page (e.g., the view and edit tabs when displaying a node). */
global $tabs; 

/** Page content: The main content of the current Drupal page.*/ 
global $content; 

/** Page content: The HTML for the right sidebar.*/
global $right; 
 
/** Footer/closing data: A string of all feed icons for the current page. */
global $feed_icons; 

/** Footer/closing data: The footer message as defined in the admin settings.*/ 
global $footer_message; 

/** Footer/closing data: The footer region.*/
global $footer;

/** Footer/closing data: Final closing markup from any modules that have altered the page.
This variable should always be output last, after all other dynamic content. */
global $closure; 
?>