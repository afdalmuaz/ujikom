const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const Image = require('./server/models/image')
const connectToDatabase = require('./server/config/db');
const User = require('./server/models/user');
const mongoose = require('mongoose');
const multer = require('multer');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwtSecret = 'muaz';
const Komentar = require('./server/models/komentar');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const LikeFoto = require('./server/models/like');





const app = express();

app.use(methodOverride('_method'));

app.use('/img', express.static(path.join(__dirname, 'img')));


app.use(express.static(path.join(__dirname, 'public')));
router.use(express.static(path.join(__dirname, '/uploads')))


// Skema untuk data gambar
const imageSchema = new mongoose.Schema({
    title: String,
    description: String,
    imagePath: String
}); 



// Konfigurasi multer untuk menyimpan gambar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = path.parse(file.originalname).name;
        const uniqueFileName = `${fileName}-${Date.now()}$(path.extname(file.originalname)}`;
        cb(null,uniqueFileName);
    }
});



const upload = multer({ storage: storage });

const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(401).send('Unauthorized');
      } else {
        req.user = decoded;
        next();
      }
    });
  } else {
    next();
  }
});


// Middleware untuk mengizinkan ekstraksi data formulir
app.use(express.urlencoded({ extended: true }));

// Panggil fungsi connectToDatabase untuk menghubungkan ke MongoDB
connectToDatabase();

// Konfigurasi EJS sebagai template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Menampilkan halaman utama
app.get('/', (req, res) => {
  res.render('index');
});

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
      jwt.verify(token, jwtSecret, (err, decoded) => {
          if (err) {
              return res.status(401).send('Unauthorized');
          } else {
              req.user = decoded;
              req.user.userId = decoded._id; // Setel req.user.userId
              next();
          }
      });
  } else {
      return res.status(401).send('Unauthorized');
  }
};



app.post('/likefoto', authMiddleware, async (req, res) => {
  const { fotoID } = req.body;

  try {
      // Memeriksa apakah pengguna sudah menyukai foto tersebut atau belum
      const existingLike = await LikeFoto.findOne({ fotoid: fotoID, userid: req.user._id });

      if(existingLike) {
          // Jika sudah menyukai, hapus like
          await LikeFoto.findByIdAndDelete(existingLike._id);
      } else {
          // Jika belum menyukai, tambahkan like baru
          const newLike = new LikeFoto({
              fotoid: fotoID,
              userid: req.user._id,
          });

          await newLike.save();
      }
      
      // Ambil ulang jumlah likes setelah perubahan
      const updatedLikes = await LikeFoto.find({ fotoid: fotoID });

      // Kirim kembali jumlah likes yang diperbarui ke halaman
      res.json({ likes: updatedLikes.length });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});






// Route untuk menangani permintaan DELETE untuk gambar
app.delete('/post/:id', async (req, res) => {
  try {
      const imageId = req.params.id;
      // Lakukan logika untuk menghapus gambar dari database
      // Contoh:
      await Image.findByIdAndDelete(imageId);
      res.redirect('/home'); // Redirect ke halaman home atau ke halaman yang sesuai
  } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).send('Internal Server Error');
  }
});


// Route untuk menangani permintaan POST ke /post/:id
app.post('/post/:id', async (req, res) => {
  try {
    // Lakukan tindakan yang sesuai dengan permintaan POST, misalnya menyimpan komentar
    const postId = req.params.id;
    const { comment } = req.body;
    
    // Simpan komentar ke dalam database atau lakukan tindakan lainnya
    
    res.redirect(`/post/${postId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/post/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id).populate('userid', 'username');
     if (!image) {  
      return res.status(404).send('Image not found');
    }
    // Ambil komentar terkait dengan foto
    const komentar = await Komentar.find({ fotoid: req.params.id }).populate('userid', 'username').sort({ tanggalkomentar: -1 });
    
    const likefoto = await LikeFoto.find({fotoid: req.params.id})
    
    // Format tanggal unggah foto
    const uploadDate = image.tanggalunggah ? new Date(image.tanggalunggah) : new Date(); // Pastikan tanggalunggah tidak null atau undefined
    
    const isOwner = true;
    
    
    res.render('post', { foto: image, uploadDate, komentar, likefoto, isOwner });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Route untuk menampilkan halaman edit post
app.get('/post/:id/edit-post', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).send('Image not found');
    }
    // Pastikan hanya pemilik yang bisa mengedit
    if (image.userid && image.userid.toString() !== req.user.userId) {
      return res.status(403).send('Forbidden');
    }
    // Render halaman edit dengan data foto yang akan diubah
    res.render('edit-post', { foto: image });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});













// Route untuk menangani permintaan POST dari form edit post
app.post('/post/:id/edit', async (req, res) => {
  try {
      const { title, description } = req.body;
      // Perbarui data foto dengan data yang baru
      await Image.findByIdAndUpdate(req.params.id, { title, description });
      res.redirect(`/post/${req.params.id}`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});





// Menampilkan halaman login
app.get('/login', (req, res) => {
  res.render('login');
});

// Menangani permintaan POST dari formulir login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).send('Invalid username or password');
    }

    // Jika login berhasil, arahkan pengguna ke halaman home
    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, {httpOnly: true});
    res.redirect('/home');
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Menampilkan halaman home
app.get('/home', async (req, res) => {
  try {
    const images = await Image.find();
    const dataImg = images.map((image) => ({
      ...image._doc,
      imageUrl: path.join('/uploads', image.imagePath)
    }));

    // Menentukan apakah pengguna sedang login
    const user = req.user || null;

    res.render('home', { images: dataImg, user });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Menampilkan halaman register
app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/upload', (req, res) => {
  res.render('upload');
});

// Route untuk menangani permintaan POST dari formulir upload
app.post('/upload', upload.single('imagePath'), async (req, res) => {
  try {
      // const { title, description } = req.body; // Dapatkan judul dan deskripsi dari permintaan
      const newImage = new Image({
          title: req.body.title,
          description: req.body.description, // Sertakan deskripsi dalam objek gambar
          imagePath: req.file.filename,

      });
      await newImage.save();
      res.redirect('/home');
  } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).send('Internal Server Error');
  }
});




// Route untuk menangani permintaan POST dari formulir pendaftaran
app.post('/register', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Mohon lengkapi semua field' });
    }

    // Destructure data dari body request
    const { username, password, email, fullName, address } = req.body;

    // Periksa apakah email sudah digunakan
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Jika email sudah digunakan, kirim respons dengan pesan kesalahan
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    // Validasi input untuk memastikan semua field terisi
    if (!username || !password || !email || !fullName || !address) {
      return res.status(400).json({ message: 'Mohon lengkapi semua field' });
    }

    // Enkripsi password sebelum menyimpan pengguna baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat objek pengguna baru berdasarkan model User
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      fullName,
      address
    });

    // Simpan pengguna baru ke basis data MongoDB
    await newUser.save();
    
    // Jika penyimpanan berhasil, redirect pengguna ke halaman login
    res.redirect('/login');
  } catch (error) {
    // Tangani kesalahan dengan mengirim pesan kesalahan kembali ke pengguna
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
  }
});















// Menjalankan server
const port = 3000;
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

