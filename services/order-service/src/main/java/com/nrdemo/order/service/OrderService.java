package com.nrdemo.order.service;

import com.newrelic.api.agent.NewRelic;
import com.newrelic.api.agent.Trace;
import com.nrdemo.order.model.Order;
import com.nrdemo.order.model.OrderItem;
import com.nrdemo.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository repo;
    private final RestTemplate restTemplate;

    @Value("${product-service.url}")
    private String productServiceUrl;

    @Trace(dispatcher = true)
    public Order createOrder(Long userId, List<Map<String, Object>> cartItems, String shippingAddress) {
        log.info("Creating order for user {} with {} items", userId, cartItems.size());
        NewRelic.addCustomParameter("order.user_id", userId);
        NewRelic.addCustomParameter("order.item_count", cartItems.size());

        Order order = new Order();
        order.setUserId(userId);
        order.setShippingAddress(shippingAddress);
        order.setStatus("processing");

        BigDecimal total = BigDecimal.ZERO;

        for (Map<String, Object> item : cartItems) {
            // This call to product-service creates a cross-service distributed trace span
            Long productId = Long.valueOf(item.get("productId").toString());
            Map<?, ?> product = verifyProduct(productId);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(productId);
            orderItem.setProductName((String) item.get("name"));
            orderItem.setQuantity(Integer.valueOf(item.get("quantity").toString()));
            orderItem.setPrice(new BigDecimal(item.get("price").toString()));

            total = total.add(orderItem.getPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity())));
            order.getItems().add(orderItem);
        }

        order.setTotal(total);
        order.setStatus("confirmed");

        Order saved = repo.save(order);
        NewRelic.addCustomParameter("order.id", saved.getId());
        NewRelic.addCustomParameter("order.total", total.doubleValue());
        log.info("Order {} created successfully. Total: ${}", saved.getId(), total);
        return saved;
    }

    // This method makes an outbound HTTP call to product-service — NR Java agent auto-traces it
    @Trace
    private Map<?, ?> verifyProduct(Long productId) {
        String url = productServiceUrl + "/api/products/" + productId;
        try {
            Map<?, ?> product = restTemplate.getForObject(url, Map.class);
            log.debug("Verified product {} exists: {}", productId, product != null ? product.get("name") : "null");
            return product;
        } catch (Exception e) {
            log.warn("Could not verify product {}: {}", productId, e.getMessage());
            return Map.of("id", productId, "verified", false);
        }
    }

    public List<Order> getUserOrders(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Order> getOrder(Long id) {
        return repo.findById(id);
    }
}
