-- Demo admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@nrdemo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgHHLN9aIX2vSbqDBEIimS', 'Admin User', 'admin'),
('demo@nrdemo.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgHHLN9aIX2vSbqDBEIimS', 'Demo User', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Electronics
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('MacBook Pro M3 Pro', 'Blazing fast M3 Pro chip, 18-hour battery, stunning Liquid Retina XDR display. Perfect for developers and creators.', 2499.00, 15, 'Laptops', 'https://picsum.photos/seed/mbp/400/300'),
('iPhone 15 Pro', 'Titanium design, A17 Pro chip with hardware ray tracing, and a 48MP main camera system.', 1199.00, 42, 'Phones', 'https://picsum.photos/seed/iphone/400/300'),
('Sony WH-1000XM5', 'Industry-leading noise cancellation headphones with 30-hour battery life and multipoint connection.', 399.00, 78, 'Audio', 'https://picsum.photos/seed/sony/400/300'),
('iPad Pro 12.9"', 'M2 chip, Liquid Retina XDR display, Thunderbolt connectivity. The ultimate iPad experience.', 1099.00, 30, 'Tablets', 'https://picsum.photos/seed/ipad/400/300'),
('Samsung 4K Monitor 32"', 'Stunning 4K UHD display with HDR600 and AMD FreeSync Premium Pro for immersive gaming and creative work.', 699.00, 25, 'Monitors', 'https://picsum.photos/seed/monitor/400/300');

-- Peripherals
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Keychron Q1 Pro', 'QMK/VIA wireless mechanical keyboard with aluminum body and gasket-mounted design.', 199.00, 60, 'Keyboards', 'https://picsum.photos/seed/keyboard/400/300'),
('Logitech MX Master 3S', 'Advanced wireless mouse with 8K DPI sensor, MagSpeed scroll wheel, and quiet clicks.', 99.00, 120, 'Mice', 'https://picsum.photos/seed/mouse/400/300'),
('LG UltraWide 34"', 'Curved ultrawide monitor with 21:9 aspect ratio, IPS panel, and USB-C connectivity.', 849.00, 18, 'Monitors', 'https://picsum.photos/seed/lg/400/300'),
('Elgato Stream Deck MK.2', '15 LCD key customizable controller for streamers and content creators.', 149.00, 45, 'Accessories', 'https://picsum.photos/seed/streamdeck/400/300'),
('Anker 140W GaN Charger', 'Compact 4-port charger with 140W USB-C power delivery for laptops, phones and tablets.', 79.00, 200, 'Accessories', 'https://picsum.photos/seed/charger/400/300');

-- Dev Tools
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Raspberry Pi 5 8GB', 'Latest Raspberry Pi with 2.4GHz quad-core ARM Cortex-A76, PCIe 2.0 and improved GPIO.', 89.00, 35, 'Dev Boards', 'https://picsum.photos/seed/rpi/400/300'),
('Arduino Mega 2560', 'Microcontroller board based on ATmega2560 with 54 digital I/O pins.', 45.00, 80, 'Dev Boards', 'https://picsum.photos/seed/arduino/400/300'),
('NVME SSD 2TB Samsung 990 Pro', 'PCIe 4.0 NVMe SSD with 7450 MB/s read speed and 256-bit AES encryption.', 179.00, 55, 'Storage', 'https://picsum.photos/seed/ssd/400/300'),
('Crucial 32GB DDR5 Kit', 'High-speed DDR5-5600 RAM for next-gen platforms. 16GBx2 dual channel kit.', 119.00, 70, 'Memory', 'https://picsum.photos/seed/ram/400/300'),
('Seagate 8TB External HDD', 'Portable USB 3.0 hard drive with automatic backup software.', 159.00, 40, 'Storage', 'https://picsum.photos/seed/hdd/400/300');

-- Smart Home
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Philips Hue Starter Kit', '4 A19 smart bulbs + Bridge. 16 million colors, voice control compatible.', 199.00, 50, 'Smart Home', 'https://picsum.photos/seed/hue/400/300'),
('Nest Thermostat', 'Smart thermostat that learns your schedule and programs itself to save energy.', 129.00, 65, 'Smart Home', 'https://picsum.photos/seed/nest/400/300'),
('Ring Video Doorbell Pro 2', '1536p HD video, 3D motion detection, and built-in Alexa integration.', 249.00, 38, 'Smart Home', 'https://picsum.photos/seed/ring/400/300'),
('Sonos Era 300', 'Spatial audio speaker with Dolby Atmos music support and AirPlay 2.', 449.00, 22, 'Audio', 'https://picsum.photos/seed/sonos/400/300'),
('Apple TV 4K 3rd Gen', 'Cinematic 4K HDR with Dolby Vision, A15 Bionic chip, and thread networking.', 129.00, 90, 'Streaming', 'https://picsum.photos/seed/appletv/400/300');
