# Farmers Market

An online platform connecting farmers and customers to sell and buy fresh, local products.

## Features
- **User Authentication:** Register/login as a customer or farmer.
- **Product Management:** Farmers can add, update, or delete products.
- **Shopping Cart:** Add products, adjust quantities, and checkout.
- **Product Browsing:** Filter by category or search products.
- **Transaction History:** View past purchases.
- **Responsive Design:** Mobile-friendly with light/dark mode.
- **Contact & Newsletter:** Send inquiries or subscribe.

## Technologies
- **Frontend:** JavaScript, HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js, MySQL, Multer, Bcrypt
- **Database:** MySQL (PlanetScale compatible)
- **Deployment:** Supports local or production (e.g., Render)

## Installation

1. Install MySQL:
   - **Ubuntu/Debian**:
     ```bash
     sudo apt update
     sudo apt install mysql-server
     sudo systemctl start mysql
     sudo systemctl enable mysql
     ```
   - **Windows**:
     - Download MySQL Installer from https://dev.mysql.com/downloads/installer/
     - Run the installer, choose "Developer Default", and follow prompts.
     - Set a root password during setup.
   - **macOS**:
     ```bash
     brew install mysql
     brew services start mysql
     ```
   - Configure MySQL:
     ```bash
     mysql_secure_installation
     ```
     Follow prompts to set root password and secure the installation.

2. Clone the repository:
   ```bash
   git clone https://github.com/ravitejeshnagasarapu/Farmers_market.git
   cd Farmers_market

3. Install dependencies:
   ```bash
    npm install
    npm install express multer mysql express-session cors

4. Set up the .env file:
   - Create a file named .env in the project root.
   - Add the following:
  
          PORT=3000
          DB_HOST=localhost
          DB_USER=root
          DB_PASSWORD=your-mysql-root-password
          SESSION_SECRET=your-unique-session-secret
          NODE_ENV=development
  
    - Replace **your-mysql-root-password** with the MySQL root password set during installation.
    - Replace **your-unique-session-secret** with a secure, random string (e.g., mysecretkey123).

5. Set up the MySQL server:
   - Log in to MySQL:
     ```bash
         mysql -u root -p
    Enter your root password
   - Create the database:
      ```MySQL
          CREATE DATABASE farmers_market;
          EXIT;

6. Start the server:
   ```bash
      npm start

7. Open " http://localhost:3000 "


## Code Modifications
- .env File:
     - Located: Project root (Farmers_market/.env).
     - Modify: Update **DB_HOST, DB_USER, DB_PASSWORD** to match your MySQL setup. For local           MySQL,use **DB_HOST=localhost**.
       - Example:
         ```bash
         DB_HOST=loaclhost
         DB_USER=root
         DB_PASSWORD=your-roor-password

 - Database Connection (server.js):
      - Located: server.js, lines ~258-263 (database connection setup).
      - Modify: If using PlanetScale, ensure SSL is enabled by adding:
        
        ```javascript
           ssl: { rejectUnauthorized: true }
      
      To the **mysql.createConnection** object:
      
      javascript
      
        const db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: true }
        });
      
      **Note**: For local MySQL, no changes are needed unless you use a non-root user or 
         different credentials.

**No Other Changes**: The code is configured to work with both local MySQL. Ensure .env is correct to avoid connection errors.


## Usage:
   - Register/Login: Use demo accounts (customer or farmer, password: password123).
   - Browse: Filter or search products, add to cart.
   - Farmers: Manage products via the "Add Product" section.
   - Checkout: Purchase items and view transactions.
   - Contact: Send inquiries or subscribe to the newsletter.

## API Endpoints:
 - POST /api/login
 - POST /api/register
 - POST /api/logout
 - GET /api/user
 - GET /api/products
 - POST /api/products
 - PUT /api/products
 - DELETE /api/products
 - POST /api/buy_product
 - GET /api/transactions
 - POST /api/contact
 - POST /api/subscribe


## Contributing:
1. Fork the repo.
2. Create a branch:

       git checkout -b feature/your-feature

3. Commit:

       git commit -m "Add feature"

4. Push:

       git push origin feature/your-feature

5. Open a pull request.

##
 Built by **Nagasarapu Ravi Tejesh**
##
