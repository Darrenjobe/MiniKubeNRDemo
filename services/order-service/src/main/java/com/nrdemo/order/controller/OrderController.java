package com.nrdemo.order.controller;

import com.nrdemo.order.model.Order;
import com.nrdemo.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService service;

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        String address = (String) body.getOrDefault("shippingAddress", "123 Demo Street, San Francisco, CA 94105");
        return ResponseEntity.status(201).body(service.createOrder(userId, items, address));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getUserOrders(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        return service.getOrder(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "order-service"));
    }

    // Internal chaos endpoint
    @PostMapping("/internal/chaos")
    public ResponseEntity<Map<String, String>> setChaos(@RequestBody Map<String, Object> config) {
        log.warn("Chaos config received by order-service: {}", config);
        return ResponseEntity.ok(Map.of("status", "chaos config received"));
    }
}
