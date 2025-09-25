require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

// --- JWT Middleware ---
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// --- Models ---
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, minlength: 3 },
  password: { type: String, required: true, minlength: 6 },
  tokens: { type: Number, default: 0 },
});
const User = mongoose.model("User", userSchema);

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: String,
  coverImage: String,
  isPremium: { type: Boolean, default: false },
  previewContent: { type: String, required: true },
  pdfPath: { type: String, default: null },
});
const Book = mongoose.model("Book", bookSchema);

// --- Seed Books ---
const seedBooks = async () => {
  const existing = await Book.countDocuments();
  if (existing > 0) return;

  const premiumBooks = [
    {
      title: "AI Revolution to Renaissance",
      author: "Dr. A.I. Strong",
      genre: "Technology / Philosophy",
      coverImage: "https://placehold.co/200x300/0077b6/fff?text=AI+Revolution",
      isPremium: true,
      previewContent:
        "A manifesto exploring Deep Learning, AI, and humanity’s path to solving global problems and achieving an ultimate renaissance.",
      pdfPath: "ai-revolution-to-renaissance.pdf",
    },
    {
      title: "My Philosophical Ideas with Graphics",
      author: "Antonio Pinto Renedo",
      genre: "Philosophy / Metaphysics",
      coverImage:
        "https://placehold.co/200x300/ff6f61/fff?text=Philosophical+Ideas",
      isPremium: true,
      previewContent:
        "A unique blend of philosophy and metaphysics, illustrated with graphics to explain future cities, space exploration, artificial gravity, and universal potential.",
      pdfPath: "my-philosophical-ideas-with-graphics.pdf",
    },
    {
      title: "History, Politics, Religion, Science: 230 Anecdotes and Stories",
      author: "David Bruce",
      genre: "History / Politics / Religion / Science",
      coverImage: "https://placehold.co/200x300/6a994e/fff?text=230+Anecdotes",
      isPremium: true,
      previewContent:
        "A wide-ranging collection of thought-provoking, humorous, and inspiring anecdotes drawn from history, politics, religion, and science — showcasing human struggles, wisdom, and resilience across centuries.",
      pdfPath:
        "history-politics-religion-science-230-anecdotes-and-stories.pdf",
    },
    {
      title:
        "Awakening Your True Path: Discovering Purpose, Passion, and Destiny",
      author: "Angelia Griffith",
      genre: "Self-Help / Spirituality / Personal Growth",
      coverImage: "https://placehold.co/200x300/f9844a/fff?text=True+Path",
      isPremium: true,
      previewContent:
        "A guide to self-discovery and empowerment, showing readers how to unlock inner wisdom, overcome obstacles, and align their lives with true purpose, passion, and destiny.",
      pdfPath:
        "awakening-your-true-path-discovering-purpose-passion-and-destiny.pdf",
    },
    {
      title: "A Cry of Innocence",
      author: "Peter C Byrnes",
      genre: "Crime / Detective Fiction / Mystery",
      coverImage:
        "https://placehold.co/200x300/3a86ff/fff?text=Cry+of+Innocence",
      isPremium: true,
      previewContent:
        "A gripping Joseph Lind detective story where justice collides with mystery. A man’s cries of innocence set off a re-examination of old cases, tangled lies, and buried truths that test the resolve of seasoned investigators.",
      pdfPath: "a-cry-of-innocence.pdf",
    },
  ];

  const genres = [
    "Fantasy",
    "Romance",
    "Thriller",
    "Mystery",
    "History",
    "Biography",
  ];
  const previewBooks = [
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      genre: "Fiction",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=To+Kill+a+Mockingbird",
      isPremium: false,
      previewContent:
        "A gripping tale of racial injustice and moral growth in Depression-era Alabama.",
    },
    {
      title: "1984",
      author: "George Orwell",
      genre: "Dystopian",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=1984",
      isPremium: false,
      previewContent:
        "A chilling vision of a totalitarian future where Big Brother watches your every move.",
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      genre: "Romance",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Pride+and+Prejudice",
      isPremium: false,
      previewContent:
        "A witty exploration of class, marriage, and personal growth in Regency England.",
    },
    {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      genre: "Classic",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Great+Gatsby",
      isPremium: false,
      previewContent:
        "A tragic portrait of the American Dream through the eyes of Jay Gatsby.",
    },
    {
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      genre: "Fantasy",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Harry+Potter",
      isPremium: false,
      previewContent:
        "A young boy discovers he's a wizard and begins his journey at Hogwarts School.",
    },
    {
      title: "The Lord of the Rings",
      author: "J.R.R. Tolkien",
      genre: "Fantasy",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Lord+of+Rings",
      isPremium: false,
      previewContent:
        "An epic quest to destroy a powerful ring and save Middle-earth from darkness.",
    },
    {
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      genre: "Coming-of-age",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Catcher+in+Rye",
      isPremium: false,
      previewContent:
        "A disillusioned teenager navigates identity, alienation, and adolescence in New York City.",
    },
    {
      title: "The Da Vinci Code",
      author: "Dan Brown",
      genre: "Thriller",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Da+Vinci+Code",
      isPremium: false,
      previewContent:
        "A symbologist unravels a murder mystery tied to secret codes and religious history.",
    },
    {
      title: "Gone with the Wind",
      author: "Margaret Mitchell",
      genre: "Historical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Gone+with+Wind",
      isPremium: false,
      previewContent:
        "A sweeping saga of love and survival during the American Civil War.",
    },
    {
      title: "The Chronicles of Narnia",
      author: "C.S. Lewis",
      genre: "Fantasy",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Chronicles+Narnia",
      isPremium: false,
      previewContent:
        "Four siblings enter a magical world through a wardrobe and battle evil.",
    },
    {
      title: "The Shining",
      author: "Stephen King",
      genre: "Horror",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Shining",
      isPremium: false,
      previewContent:
        "A writer's descent into madness while isolated in a haunted hotel with his family.",
    },
    {
      title: "The Girl with the Dragon Tattoo",
      author: "Stieg Larsson",
      genre: "Mystery",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Dragon+Tattoo",
      isPremium: false,
      previewContent:
        "A journalist and hacker investigate a decades-old disappearance in Sweden.",
    },
    {
      title: "The Hunger Games",
      author: "Suzanne Collins",
      genre: "Dystopian",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Hunger+Games",
      isPremium: false,
      previewContent:
        "A teen volunteers to take her sister's place in a deadly televised survival game.",
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      genre: "Sci-Fi",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Dune",
      isPremium: false,
      previewContent:
        "A noble family takes control of a desert planet rich in a powerful spice.",
    },
    {
      title: "The Kite Runner",
      author: "Khaled Hosseini",
      genre: "Drama",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Kite+Runner",
      isPremium: false,
      previewContent:
        "A tale of friendship, betrayal, and redemption set against Afghanistan's turbulent history.",
    },
    {
      title: "Life of Pi",
      author: "Yann Martel",
      genre: "Adventure",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Life+of+Pi",
      isPremium: false,
      previewContent:
        "A boy survives a shipwreck and shares a lifeboat with a Bengal tiger.",
    },
    {
      title: "The Road",
      author: "Cormac McCarthy",
      genre: "Post-Apocalyptic",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Road",
      isPremium: false,
      previewContent:
        "A father and son journey through a bleak, ash-covered America after an apocalypse.",
    },
    {
      title: "The Book Thief",
      author: "Markus Zusak",
      genre: "Historical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Book+Thief",
      isPremium: false,
      previewContent:
        "A young girl steals books in Nazi Germany while Death narrates her story.",
    },
    {
      title: "Brave New World",
      author: "Aldous Huxley",
      genre: "Dystopian",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Brave+New+World",
      isPremium: false,
      previewContent:
        "A futuristic society where happiness is engineered and individuality suppressed.",
    },
    {
      title: "The Picture of Dorian Gray",
      author: "Oscar Wilde",
      genre: "Gothic",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Dorian+Gray",
      isPremium: false,
      previewContent:
        "A man remains youthful while his portrait bears the marks of his sins.",
    },
    {
      title: "Frankenstein",
      author: "Mary Shelley",
      genre: "Gothic Horror",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Frankenstein",
      isPremium: false,
      previewContent:
        "A scientist creates life, only to face the tragic consequences of playing God.",
    },
    {
      title: "Wuthering Heights",
      author: "Emily Brontë",
      genre: "Gothic Romance",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Wuthering+Heights",
      isPremium: false,
      previewContent:
        "A dark, passionate love story set on the Yorkshire moors.",
    },
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      genre: "Fantasy",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Hobbit",
      isPremium: false,
      previewContent:
        "A hobbit joins a quest to reclaim a dwarf kingdom from a dragon.",
    },
    {
      title: "Fahrenheit 451",
      author: "Ray Bradbury",
      genre: "Dystopian",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Fahrenheit+451",
      isPremium: false,
      previewContent:
        "In a future where books are banned, a fireman begins to question his role.",
    },
    {
      title: "One Hundred Years of Solitude",
      author: "Gabriel García Márquez",
      genre: "Magical Realism",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=100+Years+Solitude",
      isPremium: false,
      previewContent:
        "The multi-generational saga of the Buendía family in the mythical town of Macondo.",
    },
    {
      title: "Crime and Punishment",
      author: "Fyodor Dostoevsky",
      genre: "Psychological Fiction",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Crime+Punishment",
      isPremium: false,
      previewContent:
        "A poor student commits murder and grapples with guilt and redemption.",
    },
    {
      title: "The Brothers Karamazov",
      author: "Fyodor Dostoevsky",
      genre: "Philosophical Fiction",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Brothers+Karamazov",
      isPremium: false,
      previewContent:
        "Three brothers confront faith, doubt, and morality after their father's murder.",
    },
    {
      title: "Anna Karenina",
      author: "Leo Tolstoy",
      genre: "Classic",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Anna+Karenina",
      isPremium: false,
      previewContent:
        "A tragic love affair that challenges societal norms in 19th-century Russia.",
    },
    {
      title: "War and Peace",
      author: "Leo Tolstoy",
      genre: "Historical Epic",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=War+Peace",
      isPremium: false,
      previewContent:
        "The lives of Russian nobility during the Napoleonic Wars.",
    },
    {
      title: "Les Misérables",
      author: "Victor Hugo",
      genre: "Historical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Les+Miserables",
      isPremium: false,
      previewContent:
        "An ex-convict seeks redemption amid revolution and social injustice in France.",
    },
    {
      title: "The Count of Monte Cristo",
      author: "Alexandre Dumas",
      genre: "Adventure",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Monte+Cristo",
      isPremium: false,
      previewContent:
        "A man escapes prison, acquires a fortune, and enacts an elaborate revenge.",
    },
    {
      title: "Dracula",
      author: "Bram Stoker",
      genre: "Gothic Horror",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Dracula",
      isPremium: false,
      previewContent:
        "A vampire from Transylvania invades England, spreading terror and corruption.",
    },
    {
      title: "The Adventures of Sherlock Holmes",
      author: "Arthur Conan Doyle",
      genre: "Mystery",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Sherlock+Holmes",
      isPremium: false,
      previewContent:
        "The legendary detective solves baffling crimes with logic and observation.",
    },
    {
      title: "Moby Dick",
      author: "Herman Melville",
      genre: "Adventure",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Moby+Dick",
      isPremium: false,
      previewContent:
        "A whaling captain's obsessive quest to hunt a legendary white whale.",
    },
    {
      title: "Alice's Adventures in Wonderland",
      author: "Lewis Carroll",
      genre: "Fantasy",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Alice+in+Wonderland",
      isPremium: false,
      previewContent:
        "A girl falls down a rabbit hole into a world of absurd logic and talking creatures.",
    },
    {
      title: "The Odyssey",
      author: "Homer",
      genre: "Epic Poetry",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Odyssey",
      isPremium: false,
      previewContent:
        "Odysseus' ten-year journey home after the Trojan War, filled with gods and monsters.",
    },
    {
      title: "The Iliad",
      author: "Homer",
      genre: "Epic Poetry",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Iliad",
      isPremium: false,
      previewContent:
        "The wrath of Achilles during the final weeks of the Trojan War.",
    },
    {
      title: "Don Quixote",
      author: "Miguel de Cervantes",
      genre: "Satire",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Don+Quixote",
      isPremium: false,
      previewContent:
        "A deluded knight errant tilts at windmills in a quest for chivalric glory.",
    },
    {
      title: "The Divine Comedy",
      author: "Dante Alighieri",
      genre: "Epic Poetry",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Divine+Comedy",
      isPremium: false,
      previewContent:
        "A journey through Hell, Purgatory, and Heaven guided by Virgil and Beatrice.",
    },
    {
      title: "Paradise Lost",
      author: "John Milton",
      genre: "Epic Poetry",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Paradise+Lost",
      isPremium: false,
      previewContent:
        "The biblical story of the Fall of Man, told with Satan as a tragic hero.",
    },
    {
      title: "The Grapes of Wrath",
      author: "John Steinbeck",
      genre: "Historical Fiction",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Grapes+of+Wrath",
      isPremium: false,
      previewContent:
        "A family migrates west during the Dust Bowl in search of dignity and work.",
    },
    {
      title: "Of Mice and Men",
      author: "John Steinbeck",
      genre: "Tragedy",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Of+Mice+Men",
      isPremium: false,
      previewContent:
        "Two migrant workers dream of owning a farm during the Great Depression.",
    },
    {
      title: "East of Eden",
      author: "John Steinbeck",
      genre: "Family Saga",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=East+of+Eden",
      isPremium: false,
      previewContent:
        "Two families' intertwined destinies in California's Salinas Valley.",
    },
    {
      title: "The Sun Also Rises",
      author: "Ernest Hemingway",
      genre: "Modernist",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Sun+Also+Rises",
      isPremium: false,
      previewContent:
        "Expatriates wander through post-WWI Europe, seeking meaning in a lost generation.",
    },
    {
      title: "A Farewell to Arms",
      author: "Ernest Hemingway",
      genre: "War Novel",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Farewell+to+Arms",
      isPremium: false,
      previewContent:
        "An American ambulance driver falls in love during World War I.",
    },
    {
      title: "For Whom the Bell Tolls",
      author: "Ernest Hemingway",
      genre: "War Novel",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=For+Whom+Bell+Tolls",
      isPremium: false,
      previewContent:
        "An American fights with guerrillas in the Spanish Civil War.",
    },
    {
      title: "The Old Man and the Sea",
      author: "Ernest Hemingway",
      genre: "Novella",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Old+Man+Sea",
      isPremium: false,
      previewContent:
        "An aging Cuban fisherman battles a giant marlin far out in the Gulf Stream.",
    },
    {
      title: "Catch-22",
      author: "Joseph Heller",
      genre: "Satire",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Catch-22",
      isPremium: false,
      previewContent:
        "A bomber pilot tries to stay sane amid the absurd bureaucracy of war.",
    },
    {
      title: "Slaughterhouse-Five",
      author: "Kurt Vonnegut",
      genre: "Anti-War",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Slaughterhouse+Five",
      isPremium: false,
      previewContent:
        "A soldier becomes 'unstuck in time' after surviving the Dresden firebombing.",
    },
    {
      title: "The Handmaid's Tale",
      author: "Margaret Atwood",
      genre: "Dystopian",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Handmaids+Tale",
      isPremium: false,
      previewContent:
        "A woman navigates a theocratic regime that subjugates women as breeders.",
    },
    {
      title: "Beloved",
      author: "Toni Morrison",
      genre: "Historical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Beloved",
      isPremium: false,
      previewContent:
        "A former slave is haunted by the ghost of her dead daughter.",
    },
    {
      title: "Song of Solomon",
      author: "Toni Morrison",
      genre: "Magical Realism",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Song+of+Solomon",
      isPremium: false,
      previewContent:
        "A young man discovers his family's legacy and the power of flight.",
    },
    {
      title: "The Color Purple",
      author: "Alice Walker",
      genre: "Epistolary",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Color+Purple",
      isPremium: false,
      previewContent:
        "A Black woman in the South finds her voice through letters and sisterhood.",
    },
    {
      title: "Their Eyes Were Watching God",
      author: "Zora Neale Hurston",
      genre: "Southern Gothic",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Their+Eyes",
      isPremium: false,
      previewContent:
        "A woman's journey to self-discovery through three marriages in early 20th-century Florida.",
    },
    {
      title: "Invisible Man",
      author: "Ralph Ellison",
      genre: "African-American Literature",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Invisible+Man",
      isPremium: false,
      previewContent:
        "A Black man's search for identity in a racially divided America.",
    },
    {
      title: "Native Son",
      author: "Richard Wright",
      genre: "Social Protest",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Native+Son",
      isPremium: false,
      previewContent:
        "A young Black man's life spirals after a tragic accident in 1930s Chicago.",
    },
    {
      title: "The Sound and the Fury",
      author: "William Faulkner",
      genre: "Modernist",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Sound+Fury",
      isPremium: false,
      previewContent:
        "The decline of a Southern family told through multiple fractured perspectives.",
    },
    {
      title: "As I Lay Dying",
      author: "William Faulkner",
      genre: "Southern Gothic",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=As+I+Lay+Dying",
      isPremium: false,
      previewContent:
        "A family's arduous journey to bury their mother in rural Mississippi.",
    },
    {
      title: "Light in August",
      author: "William Faulkner",
      genre: "Southern Gothic",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Light+in+August",
      isPremium: false,
      previewContent:
        "Interwoven lives in a small Southern town confront race, religion, and identity.",
    },
    {
      title: "The Scarlet Letter",
      author: "Nathaniel Hawthorne",
      genre: "Romanticism",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Scarlet+Letter",
      isPremium: false,
      previewContent:
        "A woman wears a scarlet 'A' for adultery in Puritan New England.",
    },
    {
      title: "Moby-Dick",
      author: "Herman Melville",
      genre: "Adventure",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Moby+Dick",
      isPremium: false,
      previewContent:
        "Captain Ahab's monomaniacal hunt for the white whale that maimed him.",
    },
    {
      title: "The Call of the Wild",
      author: "Jack London",
      genre: "Adventure",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Call+of+Wild",
      isPremium: false,
      previewContent:
        "A domesticated dog reverts to his wild instincts in the Yukon wilderness.",
    },
    {
      title: "White Fang",
      author: "Jack London",
      genre: "Adventure",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=White+Fang",
      isPremium: false,
      previewContent:
        "A wolf-dog's journey from wild brutality to domesticated loyalty.",
    },
    {
      title: "The Jungle",
      author: "Upton Sinclair",
      genre: "Social Criticism",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Jungle",
      isPremium: false,
      previewContent:
        "An immigrant family's brutal exploitation in Chicago's meatpacking industry.",
    },
    {
      title: "Main Street",
      author: "Sinclair Lewis",
      genre: "Satire",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Main+Street",
      isPremium: false,
      previewContent:
        "A young woman challenges the conformity of small-town American life.",
    },
    {
      title: "Babbitt",
      author: "Sinclair Lewis",
      genre: "Satire",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Babbitt",
      isPremium: false,
      previewContent:
        "A real estate agent rebels against the materialism of middle-class America.",
    },
    {
      title: "Arrowsmith",
      author: "Sinclair Lewis",
      genre: "Medical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Arrowsmith",
      isPremium: false,
      previewContent:
        "An idealistic doctor struggles between scientific integrity and public service.",
    },
    {
      title: "Elmer Gantry",
      author: "Sinclair Lewis",
      genre: "Satire",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Elmer+Gantry",
      isPremium: false,
      previewContent:
        "A charismatic but hypocritical evangelist rises to fame in America.",
    },
    {
      title: "Dodsworth",
      author: "Sinclair Lewis",
      genre: "Social Novel",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Dodsworth",
      isPremium: false,
      previewContent:
        "A retired auto magnate and his wife confront cultural differences in Europe.",
    },
    {
      title: "The Good Earth",
      author: "Pearl S. Buck",
      genre: "Historical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Good+Earth",
      isPremium: false,
      previewContent:
        "A Chinese farmer's rise from poverty through hard work and connection to the land.",
    },
    {
      title: "Sons",
      author: "Pearl S. Buck",
      genre: "Family Saga",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Sons",
      isPremium: false,
      previewContent:
        "The contrasting paths of three brothers in a changing China.",
    },
    {
      title: "A House Divided",
      author: "Pearl S. Buck",
      genre: "Historical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=House+Divided",
      isPremium: false,
      previewContent:
        "Revolution and war test a family's loyalty and resilience in early 20th-century China.",
    },
    {
      title: "The Mother",
      author: "Pearl S. Buck",
      genre: "Social Novel",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Mother",
      isPremium: false,
      previewContent:
        "A peasant woman's quiet strength sustains her family through hardship.",
    },
    {
      title: "Dragon Seed",
      author: "Pearl S. Buck",
      genre: "War Novel",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Dragon+Seed",
      isPremium: false,
      previewContent:
        "A Chinese village resists Japanese occupation during World War II.",
    },
    {
      title: "Pavilion of Women",
      author: "Pearl S. Buck",
      genre: "Historical Fiction",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Pavilion+Women",
      isPremium: false,
      previewContent:
        "An aristocratic Chinese woman seeks independence in a traditional society.",
    },
    {
      title: "The Big Sleep",
      author: "Raymond Chandler",
      genre: "Detective",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Big+Sleep",
      isPremium: false,
      previewContent:
        "Private eye Philip Marlowe navigates a web of murder and corruption in LA.",
    },
    {
      title: "Farewell, My Lovely",
      author: "Raymond Chandler",
      genre: "Detective",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Farewell+My+Lovely",
      isPremium: false,
      previewContent:
        "Marlowe searches for a missing woman in a case involving gangsters and deception.",
    },
    {
      title: "The Long Goodbye",
      author: "Raymond Chandler",
      genre: "Detective",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Long+Goodbye",
      isPremium: false,
      previewContent:
        "Marlowe's friendship with a troubled man leads to murder and betrayal.",
    },
    {
      title: "The Maltese Falcon",
      author: "Dashiell Hammett",
      genre: "Detective",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Maltese+Falcon",
      isPremium: false,
      previewContent:
        "Sam Spade gets entangled in a hunt for a priceless black statuette.",
    },
    {
      title: "The Thin Man",
      author: "Dashiell Hammett",
      genre: "Detective",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Thin+Man",
      isPremium: false,
      previewContent:
        "A retired detective and his wife solve a murder during a Christmas party.",
    },
    {
      title: "Red Harvest",
      author: "Dashiell Hammett",
      genre: "Detective",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Red+Harvest",
      isPremium: false,
      previewContent:
        "A nameless detective cleans up a corrupt mining town through violent means.",
    },
    {
      title: "The Glass Menagerie",
      author: "Tennessee Williams",
      genre: "Drama",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Glass+Menagerie",
      isPremium: false,
      previewContent:
        "A fragile family copes with illusion, memory, and disappointment in St. Louis.",
    },
    {
      title: "A Streetcar Named Desire",
      author: "Tennessee Williams",
      genre: "Drama",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Streetcar+Desire",
      isPremium: false,
      previewContent:
        "A fading Southern belle clashes with her brutish brother-in-law in New Orleans.",
    },
    {
      title: "Cat on a Hot Tin Roof",
      author: "Tennessee Williams",
      genre: "Drama",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Cat+Hot+Tin+Roof",
      isPremium: false,
      previewContent:
        "Family tensions erupt during a patriarch's birthday in the Mississippi Delta.",
    },
    {
      title: "The Crucible",
      author: "Arthur Miller",
      genre: "Historical Drama",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=The+Crucible",
      isPremium: false,
      previewContent:
        "The Salem witch trials expose mass hysteria and moral compromise.",
    },
    {
      title: "Death of a Salesman",
      author: "Arthur Miller",
      genre: "Tragedy",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Death+Salesman",
      isPremium: false,
      previewContent:
        "An aging salesman's dreams of success crumble under the weight of reality.",
    },
    {
      title: "All My Sons",
      author: "Arthur Miller",
      genre: "Drama",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=All+My+Sons",
      isPremium: false,
      previewContent:
        "A family confronts the consequences of wartime profiteering and moral failure.",
    },
    {
      title: "Cannery Row",
      author: "John Steinbeck",
      genre: "Social Novel",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Cannery+Row",
      isPremium: false,
      previewContent:
        "The colorful residents of a Monterey street form an unconventional community.",
    },
    {
      title: "Tortilla Flat",
      author: "John Steinbeck",
      genre: "Comedy",
      coverImage: "https://placehold.co/200x300/60a5fa/fff?text=Tortilla+Flat",
      isPremium: false,
      previewContent:
        "A group of paisanos in Monterey live by their own code of friendship and wine.",
    },
    {
      title: "The Winter of Our Discontent",
      author: "John Steinbeck",
      genre: "Moral Drama",
      coverImage:
        "https://placehold.co/200x300/60a5fa/fff?text=Winter+Discontent",
      isPremium: false,
      previewContent:
        "A man's moral decline as he pursues wealth and status in post-war America.",
    },
  ];

  await Book.insertMany([...premiumBooks, ...previewBooks]);
  console.log("✅ Seeded 5 premium (PDF) + 95 preview books");
};

// --- Routes ---
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) {
      return res.status(400).json({ msg: "Invalid input" });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ msg: "Username exists" });
    }
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username, password: hash, tokens: 0 });
    res.status(201).json({ msg: "Registered! Please login." });
  } catch (err) {
    res.status(500).json({ msg: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, username: user.username, tokens: user.tokens });
  } catch {
    res.status(500).json({ msg: "Login failed" });
  }
});

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find(
      {},
      "title author genre coverImage isPremium previewContent"
    );
    res.json(books);
  } catch {
    res.status(500).json({ msg: "Failed to load books" });
  }
});

// ✅ CORRECT: Define /pdf route ONCE, OUTSIDE seedBooks
app.get("/api/books/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isPremium || !book.pdfPath) {
      return res.status(404).json({ msg: "Book not available as PDF" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.tokens < 20) {
      return res.status(403).json({ msg: "Not enough tokens" });
    }
    user.tokens -= 20;
    await user.save();

    const pdfPath = path.join(__dirname, "pdfs", book.pdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ msg: "PDF file missing on server" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${book.title.replace(/[/\\?%*:|"<>]/g, "_")}.pdf"`
    );
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err) {
    console.error("PDF download error:", err);
    res.status(500).json({ msg: "Error downloading PDF" });
  }
});

app.post("/api/buy-tokens", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.tokens += 100;
    await user.save();
    res.json({ tokens: user.tokens });
  } catch {
    res.status(500).json({ msg: "Token purchase failed" });
  }
});

// Serve frontend HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Start server AFTER defining all routes
seedBooks().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});

