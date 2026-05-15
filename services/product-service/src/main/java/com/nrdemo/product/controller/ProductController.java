package com.nrdemo.product.controller;

import com.nrdemo.product.model.Product;
import com.nrdemo.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService service;

    @GetMapping
    public ResponseEntity<List<Product>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) throws InterruptedException {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(service.search(search));
        }
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(service.getByCategory(category));
        }
        return ResponseEntity.ok(service.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> get(@PathVariable Long id) throws InterruptedException {
        return service.getProduct(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product) {
        return ResponseEntity.status(201).body(service.save(product));
    }

    // Internal endpoint called by admin-service to set chaos flags
    @PostMapping("/internal/chaos")
    public ResponseEntity<Map<String, String>> setChaos(@RequestBody Map<String, Object> config) {
        boolean errors  = Boolean.TRUE.equals(config.get("errors_enabled"));
        boolean latency = Boolean.TRUE.equals(config.get("latency_enabled"));
        long latMs      = config.get("latency_ms") instanceof Number n ? n.longValue() : 2000L;
        double rate     = config.get("error_rate") instanceof Number n ? n.doubleValue() : 0.5;
        service.updateChaos(errors, latency, latMs, rate);
        return ResponseEntity.ok(Map.of("status", "chaos updated"));
    }

    // Internal endpoint: trigger a visible test error for demo
    @GetMapping("/internal/trigger-error")
    public ResponseEntity<Map<String, String>> triggerError() {
        service.triggerTestError();
        return ResponseEntity.ok(Map.of("status", "error triggered"));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "product-service"));
    }
}
