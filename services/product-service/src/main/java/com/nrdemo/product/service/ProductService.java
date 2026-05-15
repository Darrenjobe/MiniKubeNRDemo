package com.nrdemo.product.service;

import com.newrelic.api.agent.NewRelic;
import com.newrelic.api.agent.Trace;
import com.nrdemo.product.model.Product;
import com.nrdemo.product.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository repo;

    // Chaos flags set by admin-service
    private final AtomicBoolean errorsEnabled = new AtomicBoolean(false);
    private final AtomicBoolean latencyEnabled = new AtomicBoolean(false);
    private final AtomicLong latencyMs = new AtomicLong(2000);
    private final AtomicInteger errorRate50 = new AtomicInteger(50); // percentage * 10

    @PostConstruct
    void init() {
        log.info("ProductService initialized");
        NewRelic.addCustomParameter("service.version", "1.0.0");
    }

    public void updateChaos(boolean errors, boolean latency, long latMs, double errorRateFraction) {
        errorsEnabled.set(errors);
        latencyEnabled.set(latency);
        latencyMs.set(latMs);
        errorRate50.set((int)(errorRateFraction * 100));
        log.warn("CHAOS updated — errors={} latency={} latencyMs={}", errors, latency, latMs);
    }

    private void applyChaos() throws InterruptedException {
        if (latencyEnabled.get()) {
            log.warn("CHAOS: injecting {}ms latency", latencyMs.get());
            Thread.sleep(latencyMs.get());
        }
        if (errorsEnabled.get() && Math.random() * 100 < errorRate50.get()) {
            log.error("CHAOS: injecting error — simulated NullPointerException in ProductService.getProduct()");
            NewRelic.noticeError(new RuntimeException("Simulated product catalog failure (chaos injection)"));
            throw new RuntimeException("CHAOS: Simulated failure in product service");
        }
    }

    @Trace(dispatcher = true)
    public List<Product> getAllProducts() throws InterruptedException {
        applyChaos();
        List<Product> products = repo.findAll();
        NewRelic.addCustomParameter("products.count", products.size());
        log.info("Fetched {} products", products.size());
        return products;
    }

    @Trace(dispatcher = true)
    public Optional<Product> getProduct(Long id) throws InterruptedException {
        applyChaos();
        return repo.findById(id);
    }

    @Trace
    public List<Product> getByCategory(String category) {
        return repo.findByCategory(category);
    }

    @Trace
    public List<Product> search(String query) {
        log.info("Searching products: {}", query);
        return repo.search(query);
    }

    public Product save(Product product) {
        return repo.save(product);
    }

    public void triggerTestError() {
        try {
            String s = null;
            s.length(); // Deliberate NPE for demo
        } catch (NullPointerException e) {
            log.error("Test error triggered by admin panel", e);
            NewRelic.noticeError(e);
            throw new RuntimeException("Test error triggered — check New Relic for stack trace", e);
        }
    }
}
