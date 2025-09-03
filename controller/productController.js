import Product from '../models/productModel.js';
import HandleError from '../utils/handleError.js';
import handleAsynError from '../middleware/handleAsynError.js';
import APIFunctionality from '../utils/apiFunctionality.js';

// creating products
export const createProducts = handleAsynError(async (req, res, next) => {
  req.body.seller = req.user.id;
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// get all products
export const getAllProducts = handleAsynError(async (req, res, next) => {
  const resultPerPage=4;
  

  const apiFeatures = new APIFunctionality(Product.find(), req.query).search().filter();


  //getting filtered query before pagination
  const filteredQuery = apiFeatures.query.clone();
  const productCount = await filteredQuery.countDocuments();
 

  //getting total page based on filtered count
  const totalPage = Math.ceil(productCount/resultPerPage)
  const page = (req.query.page)||1;

  if(page>totalPage && productCount>0){
    return next(new HandleError("This page does not exit " ,404));
  }

  //pagination
  apiFeatures.pagination(resultPerPage)
  const products = await apiFeatures.query; 

  // Get all unique categories from all products (not just filtered ones)
  const allCategories = await Product.distinct('category');

  // Don't throw error if no products found, just return empty array
  // This allows the frontend to handle empty state gracefully
  res.status(200).json({
    success: true,
    products: products || [],
    productCount,
    resultPerPage,
    totalPage,
    currentPage:page,
    allCategories
  });
});

// update product
export const updateProduct = handleAsynError(async (req, res, next) => {
  let product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new HandleError("product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// delete product
export const deleteProduct = handleAsynError(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new HandleError("product not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "product deleted successfully",
  });
});

// accessing single product
export const getSingleProduct = handleAsynError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new HandleError("product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Creatimg and Updating review

export const createReviewforProduct = handleAsynError(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  const reviewExist = product.reviews.find(
    review => review.user?.toString() === req.user._id.toString()
  );

  if (reviewExist) {
    product.reviews.forEach(review => {
      if (review.user?.toString() === req.user._id.toString()) {
        review.rating = rating;
        review.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
  }

  
  product.numberOfReviews = product.reviews.length;

  let avg = 0;
  product.reviews.forEach(review => {
    avg += review.rating;
  });
  product.ratings = product.reviews.length>0?avg / product.reviews.length:0;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    product
  });
});

//Getting reviews

export const getProductReviews = handleAsynError(async (req, res, next)=>{
  const product = await Product.findById(req.query.id);
  if(!product){
    return next(new HandleError("Product not found",400))
  }
  res.status(200).json({
    success:true,
    reviews:product.reviews
  })
})


// Deleting reviews
export const DeleteReview = handleAsynError(async (req, res, next) => {
  const { productId, id: reviewId } = req.query;

  // 1. Find the product
  const product = await Product.findById(productId);
  if (!product) {
    return next(new HandleError("Product not found", 400));
  }

  // 2. Filter out the review to delete
  const updatedReviews = product.reviews.filter(
    (review) => review._id.toString() !== reviewId.toString()
  );

  // 3. Update product fields
  product.reviews = updatedReviews;
  product.numberOfReviews = updatedReviews.length;

  let avg = 0;
  updatedReviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = updatedReviews.length > 0 ? avg / updatedReviews.length : 0;

  // 4. Save changes
  await product.save({ validateBeforeSave: false });

  // 5. Send response
  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    product
  });
});


//Admin - getting all products
export const getAdminProducts = handleAsynError(async(req,res,next)=>{
  const products = await Product.find();
  res.status(200).json({
    success:true,
    products
  })
})

//Admin - create product (exactly like seller)
export const createAdminProduct = handleAsynError(async (req, res, next) => {
  console.log('Admin create product request body:', req.body);
  console.log('Admin create product files:', req.files ? Object.keys(req.files) : 'No files');

  let images = [];

  // Handle images from request body (base64) or files - exactly like seller
  if (req.body.images) {
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
  }

  // If no images in body, check for file uploads
  if (images.length === 0 && req.files) {
    // Handle file uploads
    const fileKeys = Object.keys(req.files).filter(key => key.startsWith('image'));
    for (const key of fileKeys) {
      const file = req.files[key];
      images.push(file.tempFilePath);
    }
  }

  if (images.length === 0) {
    return next(new HandleError("At least one product image is required", 400));
  }

  const imagesLink = [];

  // Import cloudinary at the top of the file if not already imported
  const { v2: cloudinary } = await import('cloudinary');

  for (let i = 0; i < images.length; i++) {
    try {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      return next(new HandleError("Error uploading images", 400));
    }
  }

  // Validate required fields - exactly like seller
  const { name, description, price, category, stock } = req.body;
  
  if (!name || !description || !price || !category || stock === undefined) {
    return next(new HandleError("Please provide all required fields: name, description, price, category, stock", 400));
  }

  if (price <= 0) {
    return next(new HandleError("Price must be greater than 0", 400));
  }

  if (stock < 0) {
    return next(new HandleError("Stock cannot be negative", 400));
  }

  const productData = {
    name: name.trim(),
    description: description.trim(),
    price: parseFloat(price),
    category: category.trim(),
    stock: parseInt(stock),
    image: imagesLink,
    seller: req.user._id, // Admin creates but still needs a seller reference
  };

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    product,
    message: "Product created successfully by admin"
  });
});
